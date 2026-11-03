import { expect, type Locator, type Page } from "@playwright/test";
import { getPinnedVideoTime } from "../../public/theme/scene-scroll.js";

type PresentedFrame = {
  sequence: number;
  mediaTime: number;
  currentTime: number;
  observedAt: number;
};

type ObservedVideo = HTMLVideoElement & {
  __uludottVisualFrame?: PresentedFrame;
};

type MotionScene = {
  alias: string;
  path: string;
  prepare: (page: Page) => Promise<void>;
};

const checkpoints = ["entry", "hold25", "hold70", "reverse23", "exit"] as const;
const seekTolerance = 1 / 120;
// The clips use 60 fps. A presented frame is the sample at or before a seek time.
const frameTolerance = 1 / 60 + 0.000_001;

async function decodedFrame(video: Locator) {
  return video.evaluate(async (element: HTMLVideoElement) => {
    if (
      element.readyState < 2 ||
      !element.videoWidth ||
      !element.videoHeight ||
      element.seeking ||
      !element.paused
    )
      throw new Error("PAUSED_DECODED_VIDEO_REQUIRED");
    const width = element.videoWidth;
    const height = element.videoHeight;
    const currentTime = element.currentTime;
    // This unattached canvas only reads decoded video pixels. It never replaces
    // the visible video, its poster, or any other page content.
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("VIDEO_PIXEL_READBACK_REQUIRED");
    context.drawImage(element, 0, 0);
    const pixels = context.getImageData(0, 0, width, height);
    const digest = await crypto.subtle.digest("SHA-256", pixels.data);
    return {
      width,
      height,
      currentTime,
      rgbaSha256: [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(""),
    };
  });
}

/** Exercise the real scroll handler; the test never sets a video's currentTime. */
export function visualMotionScenes(): MotionScene[] {
  return [0, 1, 2].flatMap((trackIndex) =>
    checkpoints.map((checkpoint, checkpointIndex) => ({
      alias: `people-video-${trackIndex + 1}-${checkpoint}`,
      path: "/hakkimizda",
      prepare: async (page: Page) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const tracks = page.locator(".people-video-track");
        await expect(tracks).toHaveCount(3);
        const track = tracks.nth(trackIndex);
        const video = track.locator("video");
        await expect(video).toHaveCount(1);

        // Observe before scrolling, so a paused seek cannot present its only
        // decoded frame before the test starts listening for it.
        await video.evaluate((element: ObservedVideo) => {
          if (typeof element.requestVideoFrameCallback !== "function")
            throw new Error("VIDEO_FRAME_CALLBACK_REQUIRED");
          element.__uludottVisualFrame = {
            sequence: 0,
            mediaTime: Number.NaN,
            currentTime: Number.NaN,
            observedAt: Number.NEGATIVE_INFINITY,
          };
          const observe: VideoFrameRequestCallback = (now, metadata) => {
            element.__uludottVisualFrame = {
              sequence: element.__uludottVisualFrame!.sequence + 1,
              mediaTime: metadata.mediaTime,
              currentTime: element.currentTime,
              observedAt: now,
            };
            element.requestVideoFrameCallback(observe);
          };
          element.requestVideoFrameCallback(observe);
        });

        const geometry = await track.evaluate((element) => {
          const hero = element.querySelector<HTMLElement>(".people-hero");
          if (!hero) throw new Error("PEOPLE_HERO_REQUIRED");
          const bounds = element.getBoundingClientRect();
          return {
            hold: Math.max(
              1,
              bounds.height - hero.getBoundingClientRect().height,
            ),
            heroHeight: hero.getBoundingClientRect().height,
            viewportHeight: innerHeight,
          };
        });
        const offsets = [
          -geometry.viewportHeight * 0.45,
          geometry.hold * 0.25,
          geometry.hold * 0.7,
          geometry.hold * 0.23,
          geometry.hold + geometry.heroHeight / 2,
        ];

        let checkpointPresentedCallbackObserved = false;
        for (const offset of offsets.slice(0, checkpointIndex + 1)) {
          let lastDiagnostics: unknown;
          let before = await video.evaluate((element: ObservedVideo) => ({
            sequence: element.__uludottVisualFrame!.sequence,
            issuedAt: performance.now(),
          }));
          await track.evaluate((element, offset) => {
            scrollTo(0, element.getBoundingClientRect().top + scrollY + offset);
          }, offset);
          await expect
            .poll(
              async () => {
                const state = await video.evaluate((element: ObservedVideo) => {
                  const hero = element.closest<HTMLElement>(".people-hero")!;
                  const track = element.closest<HTMLElement>(
                    ".people-video-track",
                  )!;
                  const h = hero.getBoundingClientRect();
                  const t = track.getBoundingClientRect();
                  return {
                    geometry: {
                      trackTop: t.top,
                      trackHeight: t.height,
                      heroTop: h.top,
                      heroHeight: h.height,
                      viewportHeight: innerHeight,
                      duration: element.duration,
                    },
                    paused: element.paused,
                    seeking: element.seeking,
                    readyState: element.readyState,
                    videoWidth: element.videoWidth,
                    videoHeight: element.videoHeight,
                    currentTime: element.currentTime,
                    frame: element.__uludottVisualFrame!,
                    normalMotion: !matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches,
                  };
                });
                const target = getPinnedVideoTime(state.geometry);
                const center = Math.max(
                  0,
                  (state.geometry.viewportHeight - state.geometry.heroHeight) /
                    2,
                );
                const expectedHeroTop = Math.min(
                  Math.max(center, -offset),
                  geometry.hold - offset,
                );
                const positionError = state.geometry.trackTop + offset;
                const freshCallback =
                  state.frame.sequence > before.sequence &&
                  state.frame.observedAt >= before.issuedAt;
                const callbackMatchesTarget =
                  Math.abs(state.frame.mediaTime - target) <= frameTolerance;
                checkpointPresentedCallbackObserved =
                  freshCallback && callbackMatchesTarget;
                // Only numeric media/geometry state and booleans are retained.
                // Do not include URLs, source markup, private content, or tokens.
                lastDiagnostics = {
                  ...state,
                  before,
                  requestedOffset: offset,
                  expectedHeroTop,
                  target,
                  positionError,
                  freshCallback,
                  seekTolerance,
                  frameTolerance,
                };
                // Earlier lazy images can move this track after the initial
                // approach. Correct the physical scroll against current layout,
                // letting the application's own handler choose the new time.
                if (Math.abs(positionError) > 1) {
                  before = await video.evaluate((element: ObservedVideo) => ({
                    sequence: element.__uludottVisualFrame!.sequence,
                    issuedAt: performance.now(),
                  }));
                  checkpointPresentedCallbackObserved = false;
                  await page.evaluate(
                    (delta) => scrollBy(0, delta),
                    positionError,
                  );
                  return false;
                }
                return (
                  state.normalMotion &&
                  Math.abs(positionError) <= 1 &&
                  Math.abs(state.geometry.heroTop - expectedHeroTop) <= 1 &&
                  Number.isFinite(state.geometry.duration) &&
                  state.geometry.duration > 0 &&
                  state.readyState >= 2 &&
                  state.videoWidth > 0 &&
                  state.videoHeight > 0 &&
                  state.paused &&
                  !state.seeking &&
                  Math.abs(state.currentTime - target) <= seekTolerance &&
                  // Some paused browser pipelines never deliver rVFC callbacks.
                  // The decoded-frame readback below proves their stable media
                  // pixels; it does not claim that a callback was observed.
                  (!freshCallback || callbackMatchesTarget)
                );
              },
              {
                message: `People video ${trackIndex + 1} must settle to the real scroll seek for ${checkpoint}`,
                timeout: 20_000,
                intervals: [20, 50, 100],
              },
            )
            .toBe(true)
            .catch((cause: unknown) => {
              throw new Error(
                `VISUAL_VIDEO_NOT_SETTLED track=${trackIndex + 1} checkpoint=${checkpoint} ${JSON.stringify(
                  lastDiagnostics,
                  (_key, value: unknown) =>
                    typeof value === "number" && !Number.isFinite(value)
                      ? String(value)
                      : value,
                )}`,
                { cause },
              );
            });
        }

        const firstFrame = await decodedFrame(video);
        await page.waitForTimeout(400);
        const secondFrame = await decodedFrame(video);
        expect(
          secondFrame,
          "Paused decoded video pixels must remain stable",
        ).toEqual(firstFrame);
        await expect
          .poll(() =>
            video.evaluate((element: HTMLVideoElement) => ({
              paused: element.paused,
              seeking: element.seeking,
              time: element.currentTime,
            })),
          )
          .toEqual({
            paused: true,
            seeking: false,
            time: firstFrame.currentTime,
          });
        const media = await video.evaluate((element: ObservedVideo) => {
          const hero = element.closest<HTMLElement>(".people-hero")!;
          const track = element.closest<HTMLElement>(".people-video-track")!;
          const h = hero.getBoundingClientRect();
          const t = track.getBoundingClientRect();
          return {
            geometry: {
              trackTop: t.top,
              trackHeight: t.height,
              heroTop: h.top,
              heroHeight: h.height,
              viewportHeight: innerHeight,
              duration: element.duration,
            },
          };
        });
        const target = getPinnedVideoTime(media.geometry);
        expect(
          Math.abs(media.geometry.trackTop + offsets[checkpointIndex]),
          "Track must retain the requested checkpoint after decoded-frame stability",
        ).toBeLessThanOrEqual(1);
        expect(Math.abs(secondFrame.currentTime - target)).toBeLessThanOrEqual(
          seekTolerance,
        );
        await page.evaluate(
          (evidence) => {
            Object.assign(window, { __uludottVisualVideoEvidence: evidence });
          },
          {
            trackIndex: trackIndex + 1,
            checkpoint,
            ...secondFrame,
            ...media,
            presentedCallbackObserved: checkpointPresentedCallbackObserved,
            target,
          },
        );
      },
    })),
  );
}
