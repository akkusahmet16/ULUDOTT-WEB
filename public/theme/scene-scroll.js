const clamp = (value) => Math.max(0, Math.min(1, value));
// One timeline for the application and its static preview. Existing clips are 60fps.
export function getPinnedVideoTime({
  trackTop,
  trackHeight,
  heroTop,
  heroHeight,
  viewportHeight,
  duration,
  frameRate = 60,
}) {
  if (!Number.isFinite(duration) || duration <= 0 || heroHeight <= 0) return 0;
  const center = Math.max(0, (viewportHeight - heroHeight) / 2);
  const hold = Math.max(1, trackHeight - heroHeight);
  const release = Math.max(0, duration - 12 / frameRate);
  const last = Math.max(0, duration - 1 / frameRate);
  const lead = Math.min(3 / frameRate, release * 0.1);
  if (trackTop > center)
    return (
      lead *
      clamp((center + heroHeight * 0.15 - trackTop) / (heroHeight * 0.15))
    );
  if (trackTop >= center - hold)
    return lead + (release - lead) * clamp((center - trackTop) / hold);
  return release + (last - release) * clamp((center - heroTop) / heroHeight);
}
