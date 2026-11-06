import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Faz 7 / İş 7A — WCAG Erişilebilirlik ve Kontrast Kapısı", () => {
  describe("Renk Kontrastı Oranları (WCAG 2.1 AA ≥ 4.5:1, AAA ≥ 7:1)", () => {
    const bgDark = "#0c0d1b";
    const adminBgDark = "#0d101b";

    it("Cinematic arka plan üzerinde metin renkleri WCAG AAA (≥ 7:1) sağlamalıdır", () => {
      const creamRatio = contrastRatio(bgDark, "#fff9cb");
      const mutedRatio = contrastRatio(bgDark, "#cac4d7");
      const purpleRatio = contrastRatio(bgDark, "#edb2e4");
      const limeRatio = contrastRatio(bgDark, "#f6b6cb");
      const coralRatio = contrastRatio(bgDark, "#ffbd9e");

      expect(creamRatio).toBeGreaterThanOrEqual(7.0);
      expect(mutedRatio).toBeGreaterThanOrEqual(7.0);
      expect(purpleRatio).toBeGreaterThanOrEqual(7.0);
      expect(limeRatio).toBeGreaterThanOrEqual(7.0);
      expect(coralRatio).toBeGreaterThanOrEqual(7.0);
    });

    it("Yönetim paneli arka planı üzerinde metin renkleri WCAG AAA sağlamalıdır", () => {
      const whiteRatio = contrastRatio(adminBgDark, "#ffffff");
      const adminMutedRatio = contrastRatio(adminBgDark, "#aab3c8");

      expect(whiteRatio).toBeGreaterThanOrEqual(7.0);
      expect(adminMutedRatio).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe("CSS Erişilebilirlik Kuralları ve Medya Sorguları", () => {
    it("CSS dosyalarında prefers-reduced-motion sorguları tanımlıdır", () => {
      const baseCss = readFileSync(
        join(process.cwd(), "src/styles/base.css"),
        "utf8"
      );
      const cinematicCss = readFileSync(
        join(process.cwd(), "src/styles/cinematic.css"),
        "utf8"
      );
      const homeModuleCss = readFileSync(
        join(process.cwd(), "src/styles/home.module.css"),
        "utf8"
      );

      expect(baseCss).toContain("(prefers-reduced-motion: reduce)");
      expect(cinematicCss).toContain("(prefers-reduced-motion: reduce)");
      expect(homeModuleCss).toContain("(prefers-reduced-motion: reduce)");
    });

    it("Klavye odaklanması için :focus-visible kuralı görünür kontur sağlar", () => {
      const baseCss = readFileSync(
        join(process.cwd(), "src/styles/base.css"),
        "utf8"
      );
      expect(baseCss).toContain(":focus-visible");
      expect(baseCss).toContain("outline:");
    });

    it("Dokunma hedefleri minimum 44px yükseklik kuralını sağlar", () => {
      const baseCss = readFileSync(
        join(process.cwd(), "src/styles/base.css"),
        "utf8"
      );
      expect(baseCss).toContain("min-height: 44px");
    });
  });
});
