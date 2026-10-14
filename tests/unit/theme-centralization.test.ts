import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { colorViolations, sourceFiles } from "../helpers/theme-source.ts";

it("tema renkleri yalnız themes.css'tedir; onaylı JPEG sabiti tam bağlamıyla korunur", () => {
  const errors: string[] = [];
  for (const path of sourceFiles()) {
    if (path === "src/styles/themes.css" || path.startsWith("src/db/")) continue;
    const source = readFileSync(path, "utf8");
    // Kullanıcı 14.10.2026 onayı: dokunulmaz JPEG flatten arka planı UI teması
    // değildir. Yalnız bu tek ifade muaf; aynı dosyada başka renk hata üretir.
    if (path === "src/modules/media/infrastructure/process-image.ts") {
      const exact = ".flatten({background:'#f4efdf'})";
      expect(source.split(exact)).toHaveLength(2);
      errors.push(...colorViolations(path, source.replace(exact, ".flatten({})")));
    } else errors.push(...colorViolations(path, source));
  }
  expect(errors).toEqual([]);
});

it("tarayıcı hex, fonksiyon, ad, inline style ve SVG renklerini yakalar", () => {
  for (const value of ["#abc", "#abcd", "#aabbcc", "#aabbccdd", "rgb(1,2,3)", "hsl(0,0%,0%)", "oklch(0 0 0)", "lab(0 0 0)", "red"]) {
    expect(colorViolations("example.css", `.a { color: ${value}; }`)).not.toEqual([]);
  }
  expect(colorViolations("example.tsx", '<a href="#abc" style={{ color: "red" }}><svg fill="blue" /></a>')).not.toEqual([]);
  expect(colorViolations("example.tsx", '<a href="#abc" style={{ color: "var(--color-text)", "--example": "inherit" }}><svg fill="currentColor" /></a>')).toEqual([]);
  expect(colorViolations("example.css", '.a { white-space: pre-wrap; color: var(--color-text); background: transparent; }')).toEqual([]);
});
