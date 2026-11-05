import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcssSafe = require("next/dist/compiled/postcss-safe-parser");

interface PostcssNode {
  prop?: string;
  value?: string;
}

export type RgbaTuple = [number, number, number, number];
export type RgbTuple = [number, number, number];

export function parseCssColorToRgba(raw: string): RgbaTuple {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "white") {
    return [1, 1, 1, 1];
  }
  if (trimmed === "black") {
    return [0, 0, 0, 1];
  }

  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("") + "ff";
    } else if (hex.length === 4) {
      hex = hex.split("").map((c) => c + c).join("");
    } else if (hex.length === 6) {
      hex = hex + "ff";
    }
    if (hex.length !== 8) {
      throw new Error(`Unsupported hex format: ${raw}`);
    }
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      parseInt(hex.slice(6, 8), 16) / 255,
    ];
  }

  const rgbSlashMatch = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+(?:\.\d+)?)%\s*\)$/.exec(trimmed);
  if (rgbSlashMatch) {
    return [
      Number(rgbSlashMatch[1]) / 255,
      Number(rgbSlashMatch[2]) / 255,
      Number(rgbSlashMatch[3]) / 255,
      Number(rgbSlashMatch[4]) / 100,
    ];
  }

  throw new Error(`Unsupported color literal for contrast calculation: ${raw}`);
}

export function alphaComposite(fg: RgbaTuple, backdrop: RgbTuple): RgbTuple {
  const [r, g, b, a] = fg;
  return [
    r * a + backdrop[0] * (1 - a),
    g * a + backdrop[1] * (1 - a),
    b * a + backdrop[2] * (1 - a),
  ];
}

export function relativeLuminance([r, g, b]: RgbTuple): number {
  const channel = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function wcagContrastRatio(fgColor: string, bgColor: string, backdropColor = "#0c0d1b"): number {
  const backdropRgba = parseCssColorToRgba(backdropColor);
  const backdropRgb: RgbTuple = [backdropRgba[0], backdropRgba[1], backdropRgba[2]];

  const bgRgba = parseCssColorToRgba(bgColor);
  const compositedBg = alphaComposite(bgRgba, backdropRgb);

  const fgRgba = parseCssColorToRgba(fgColor);
  const compositedFg = alphaComposite(fgRgba, compositedBg);

  const l1 = relativeLuminance(compositedFg);
  const l2 = relativeLuminance(compositedBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Subtle decorative border tokens preserved under the v0.1 visual lock (Plan İş 1A line 123 & Rule 4).
 * When evaluated against WCAG 2.2 SC 1.4.11 (3.0:1 non-text contrast), these subtle divider lines
 * sit below 3.0:1 against the dark surface while adjacent text/surface contrast exceeds 8.0:1.
 * Recorded explicitly without modifying the v0.1 palette.
 */
export const DOCUMENTED_VISUAL_LOCK_SUBTLE_BORDERS = [
  {
    id: "public-line-on-ink",
    fgToken: "--line",
    bgToken: "--ink",
    expectedRatio: 2.27,
    wcagNonTextTarget: 3.0,
    note: "v0.1 dekoratif ayırıcı çizgi (--line #51495f / --ink #0c0d1b = 2.27:1); görsel kilit gereği palet değiştirilmez, açık uyuşmazlık/not olarak kayıtlıdır.",
  },
  {
    id: "admin-border-on-admin-bg",
    fgToken: "--admin-border",
    bgToken: "--admin-bg",
    expectedRatio: 1.33,
    wcagNonTextTarget: 3.0,
    note: "v0.1 admin panel kenar çizgisi (--admin-border #ffffff1c / --admin-bg #0d101b = 1.33:1); görsel kilit gereği palet değiştirilmez, açık uyuşmazlık/not olarak kayıtlıdır.",
  },
] as const;

describe("WCAG 2.2 AA Theme Contrast Verification Suite (Faz 1 — İş 1A)", () => {
  const themesCssPath = path.resolve(process.cwd(), "src/styles/themes.css");
  const themesCss = fs.readFileSync(themesCssPath, "utf8");
  const tokens = new Map<string, string>();

  const root = postcssSafe(themesCss);
  root.walkDecls((decl: PostcssNode) => {
    if (decl.prop && decl.prop.startsWith("--")) {
      tokens.set(decl.prop, (decl.value ?? "").trim());
    }
  });

  function getToken(name: string): string {
    const val = tokens.get(name);
    expect(val, `Token ${name} must exist in themes.css`).toBeDefined();
    return val!;
  }

  it("verifies all primary cinematic (public) text and interactive token pairs meet WCAG 2.2 AA (>= 4.5:1)", () => {
    const publicPairs: Array<{ label: string; fg: string; bg: string; minRatio: number }> = [
      { label: "body text (--cream on --ink)", fg: getToken("--cream"), bg: getToken("--ink"), minRatio: 4.5 },
      { label: "panel text (--cream on --panel)", fg: getToken("--cream"), bg: getToken("--panel"), minRatio: 4.5 },
      { label: "muted text (--muted on --ink)", fg: getToken("--muted"), bg: getToken("--ink"), minRatio: 4.5 },
      { label: "muted on panel (--muted on --panel)", fg: getToken("--muted"), bg: getToken("--panel"), minRatio: 4.5 },
      { label: "purple accent (--purple on --ink)", fg: getToken("--purple"), bg: getToken("--ink"), minRatio: 4.5 },
      { label: "purple on panel (--purple on --panel)", fg: getToken("--purple"), bg: getToken("--panel"), minRatio: 4.5 },
      { label: "lime accent (--lime on --ink)", fg: getToken("--lime"), bg: getToken("--ink"), minRatio: 4.5 },
      { label: "primary CTA button (--ink on --lime)", fg: getToken("--ink"), bg: getToken("--lime"), minRatio: 4.5 },
      { label: "focus outline (--coral on --ink)", fg: getToken("--coral"), bg: getToken("--ink"), minRatio: 3.0 },
    ];

    for (const pair of publicPairs) {
      const ratio = wcagContrastRatio(pair.fg, pair.bg, getToken("--ink"));
      expect(ratio, `${pair.label} contrast (${ratio}:1) must be >= ${pair.minRatio}:1`).toBeGreaterThanOrEqual(pair.minRatio);
    }
  });

  it("verifies all primary classic (admin) text and interactive token pairs meet WCAG 2.2 AA (>= 4.5:1)", () => {
    const adminBg = getToken("--admin-bg");
    const adminPairs: Array<{ label: string; fg: string; bg: string; minRatio: number }> = [
      { label: "admin body (--color-f8f5e6 on --admin-bg)", fg: getToken("--color-f8f5e6"), bg: adminBg, minRatio: 4.5 },
      { label: "admin panel text (--color-f8f5e6 on --admin-panel)", fg: getToken("--color-f8f5e6"), bg: getToken("--admin-panel"), minRatio: 4.5 },
      { label: "admin muted (--admin-muted on --admin-bg)", fg: getToken("--admin-muted"), bg: adminBg, minRatio: 4.5 },
      { label: "admin muted on panel (--admin-muted on --admin-panel)", fg: getToken("--admin-muted"), bg: getToken("--admin-panel"), minRatio: 4.5 },
      { label: "admin skip link (--color-10121d on --color-f4bfd2)", fg: getToken("--color-10121d"), bg: getToken("--color-f4bfd2"), minRatio: 4.5 },
      { label: "admin CTA button (--color-201722 on --color-f4bfd2)", fg: getToken("--color-201722"), bg: getToken("--color-f4bfd2"), minRatio: 4.5 },
    ];

    for (const pair of adminPairs) {
      const ratio = wcagContrastRatio(pair.fg, pair.bg, adminBg);
      expect(ratio, `${pair.label} contrast (${ratio}:1) must be >= ${pair.minRatio}:1`).toBeGreaterThanOrEqual(pair.minRatio);
    }
  });

  it("verifies all 13 scene sky (--sky-*) backgrounds maintain WCAG 2.2 AA normal-text contrast with --cream and --muted", () => {
    const cream = getToken("--cream");
    const muted = getToken("--muted");
    const skyEntries = Array.from(tokens.entries()).filter(([k]) => k.startsWith("--sky-"));
    expect(skyEntries.length).toBe(13);

    for (const [skyToken, skyHex] of skyEntries) {
      const creamRatio = wcagContrastRatio(cream, skyHex, getToken("--ink"));
      const mutedRatio = wcagContrastRatio(muted, skyHex, getToken("--ink"));
      expect(creamRatio, `--cream on ${skyToken} (${skyHex})`).toBeGreaterThanOrEqual(4.5);
      expect(mutedRatio, `--muted on ${skyToken} (${skyHex})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("records subtle v0.1 decorative border contrasts below 3.0:1 as explicit visual-lock discrepancies without altering colors", () => {
    for (const item of DOCUMENTED_VISUAL_LOCK_SUBTLE_BORDERS) {
      const fg = getToken(item.fgToken);
      const bg = getToken(item.bgToken);
      const ratio = wcagContrastRatio(fg, bg, bg);
      expect(ratio).toBe(item.expectedRatio);
      expect(ratio).toBeLessThan(item.wcagNonTextTarget);
      expect(item.note.length).toBeGreaterThan(20);
    }
  });
});
