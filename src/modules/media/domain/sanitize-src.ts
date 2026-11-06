/**
 * Sanitizes image and media src paths to prevent Next.js Image crashes
 * (specifically protocol-relative URLs starting with //, unrooted paths, or
 * references to raw design input folders).
 */
export function sanitizeMediaSrc(
  src: string | null | undefined,
  fallback = "",
): string {
  if (!src || typeof src !== "string") return fallback;
  let s = src.trim();
  if (!s) return fallback;

  // Replace double or multiple leading slashes (e.g. "//tasarim-girdileri/..." -> "/tasarim-girdileri/...")
  // Next.js Image strictly rejects protocol-relative URLs starting with "//"
  s = s.replace(/^\/{2,}/, "/");

  // Map local design folder / raw intake paths to public web paths
  if (
    s.includes("tasarim-girdileri/06-oyunlar/ulujam26-1-oyun") ||
    s.includes("lostpieces")
  ) {
    return "/community/06-oyunlar/derece/ulujam26-1-oyun-lostpieces.webp";
  }
  if (
    s.includes("tasarim-girdileri/06-oyunlar/ulujam26-2-oyun") ||
    s.includes("lostchildsoul")
  ) {
    return "/community/06-oyunlar/derece/ulujam26-2-oyun-lostchildsoul.webp";
  }
  if (
    s.includes("tasarim-girdileri/06-oyunlar/ulujam26-3-oyun") ||
    s.includes("projectsw")
  ) {
    return "/community/06-oyunlar/derece/ulujam26-3-oyun-projectsw.webp";
  }
  if (
    s.startsWith("tasarim-girdileri/") ||
    s.startsWith("/tasarim-girdileri/")
  ) {
    s = s.replace(/^\/?tasarim-girdileri\//, "/community/");
  }

  // Handle absolute web URLs
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:")
  ) {
    return s;
  }

  // If someone entered a domain starting with "//" (e.g. //img.itch.zone/...)
  if (s.startsWith("//")) {
    return "https:" + s;
  }

  // Ensure root slash for relative path
  if (!s.startsWith("/")) {
    s = "/" + s;
  }

  return s;
}
