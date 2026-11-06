import { z } from "zod";
export function youtubeVideoId(value: string): string | null {
  try {
    if (/[\s\\]/.test(value)) return null;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const host = url.hostname;
    if (
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(host)
    )
      return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      host === "youtu.be" && parts.length === 1
        ? parts[0]
        : url.pathname === "/watch" && host.endsWith("youtube.com")
          ? url.searchParams.get("v")
          : parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])
            ? parts[1]
            : null;
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export const ulujamSettingsSchema = z
  .strictObject({
    year: z.int().min(2000).max(2200),
    panelTitle: z.string().trim().min(1).max(100),
    panelDescription: z.string().trim().min(1).max(300),
    videoUrl: z
      .string()
      .trim()
      .max(1000)
      .refine(
        (value) => value === "" || !!youtubeVideoId(value),
        "Geçerli bir YouTube bağlantısı girin",
      ),
    videoTitle: z.string().trim().min(1).max(160),
    videoDescription: z.string().trim().max(2000),
    videoCover: z.string().min(1).max(500),
    videoPublished: z.boolean(),
    formId: z.uuid().nullable().optional(),
    applicationUrl: z.string().trim().max(1000).optional(),
    managedFormIds: z.array(z.uuid()).max(100).default([]),
    applicationPublished: z.boolean(),
    applicationTitle: z.string().trim().min(1).max(160),
    applicationDescription: z.string().trim().max(3000),
    applicationButtonLabel: z.string().trim().min(1).max(80),
    applicationClosedMessage: z.string().trim().min(1).max(500),
  })
  .refine(
    (value) => !value.videoPublished || !!value.videoUrl,
    "Video bağlantısı gerekli",
  )
  .refine(
    (value) => !value.applicationPublished || !!value.formId || !!value.applicationUrl,
    "Başvuru formu veya bağlantı linki girin",
  );
export type UlujamSettings = z.infer<typeof ulujamSettingsSchema>;
export const defaultUlujamSettings: UlujamSettings = {
  year: 2027,
  panelTitle: "UluJam",
  panelDescription: "Bir fikir. Bir takım. Bir oyun.",
  videoUrl: "https://youtu.be/_ECGC1V__xo",
  videoTitle: "UluJam vlog",
  videoDescription: "UluJam’i birlikte yaşadığımız anlara bir bakış.",
  videoCover: "/community/02-ulujam/ulujam-vlog-kapak.webp",
  videoPublished: true,
  formId: null,
  managedFormIds: [],
  applicationPublished: false,
  applicationTitle: "UluJam başvuruları",
  applicationDescription: "Bir fikir. Bir takım. Bir oyun.",
  applicationButtonLabel: "Başvuru yap",
  applicationClosedMessage:
    "Başvuru durumu kapalı. Güncel bilgi ve arşive UluJam sayfasından ulaşabilirsin.",
};
export type UlujamPresentation = UlujamSettings & {
  videoId: string | null;
  application: {
    open: boolean;
    url: string | null;
    title: string;
    description: string;
    buttonLabel: string;
    message: string;
  };
};
