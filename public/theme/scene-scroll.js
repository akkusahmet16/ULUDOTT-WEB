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
  const lead = Math.min(12 / frameRate, release * 0.5);
  if (trackTop > center)
    return (
      lead * clamp((viewportHeight - trackTop) / (viewportHeight - center))
    );
  if (trackTop >= center - hold)
    return lead + (release - lead) * clamp((center - trackTop) / hold);
  return release + (last - release) * clamp((center - heroTop) / heroHeight);
}
