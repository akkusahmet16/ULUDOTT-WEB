const TURKISH_ASCII_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function normalizeSozlukTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function normalizeSozlukNick(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr-TR");
}

export function toSozlukSlug(raw: string): string {
  const mapped = Array.from(normalizeSozlukTitle(raw))
    .map((ch) => TURKISH_ASCII_MAP[ch] ?? ch)
    .join("");

  return mapped
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
