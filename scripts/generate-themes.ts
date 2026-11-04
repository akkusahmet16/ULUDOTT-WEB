import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcssSafe = require("next/dist/compiled/postcss-safe-parser");

const CSS_FILES = [
  "src/styles/tokens.css",
  "src/styles/cinematic.css",
  "src/styles/home.module.css",
  "src/app/(public)/iletisim/contact.module.css",
  "src/modules/cards/ui/web-card.module.css",
  "src/modules/admin/ui/content-workspace.module.css",
  "src/modules/admin/ui/dashboard.module.css",
  "src/modules/admin/ui/admin-workspace.module.css",
  "src/modules/teams/ui/team-page.module.css",
  "src/modules/events/ui/event-editor.module.css",
  "src/modules/events/ui/past-events-carousel.module.css",
];

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const RGB_COLOR_RE = /\b(?:rgb|rgba)\([^)]+\)/g;
const GRADIENT_RE = /\b(?:linear-gradient|radial-gradient|conic-gradient)\([^;}]+\)/g;

interface TokenEntry {
  name: string;
  value: string;
  category: string;
  comment?: string;
}

interface PostcssDeclNode {
  prop: string;
  value: string;
  important?: boolean;
}

export function generateThemesCss(): string {
  const tokenNameToValue = new Map<string, string>();

  function registerToken(name: string, value: string, category: string, comment?: string): TokenEntry {
    const normalizedVal = value.trim();
    if (tokenNameToValue.has(name)) {
      const existing = tokenNameToValue.get(name)!;
      if (existing !== normalizedVal) {
        throw new Error(
          `Token name collision: "${name}" is already defined as "${existing}", cannot redefine as "${normalizedVal}"`
        );
      }
    } else {
      tokenNameToValue.set(name, normalizedVal);
    }
    return { name, value: normalizedVal, category, comment };
  }

  const baselineTokens: TokenEntry[] = [
    // tokens.css root tokens
    registerToken("--ink", "#0c0d1b", "baseline", "tokens.css"),
    registerToken("--panel", "#18182c", "baseline", "tokens.css"),
    registerToken("--cream", "#fff9cb", "baseline", "tokens.css"),
    registerToken("--muted", "#cac4d7", "baseline", "tokens.css"),
    registerToken("--purple", "#edb2e4", "baseline", "tokens.css"),
    registerToken("--lime", "#f6b6cb", "baseline", "tokens.css"),
    registerToken("--coral", "#ffbd9e", "baseline", "tokens.css"),
    registerToken("--line", "#51495f", "baseline", "tokens.css"),
    registerToken("--radius", "4px", "baseline", "tokens.css"),
    registerToken("--space", "clamp(22px, 6vw, 100px)", "baseline", "tokens.css"),
    registerToken("--font", "var(--font-body), Arial, sans-serif", "baseline", "tokens.css"),
    registerToken("--heading", "var(--font-display), Impact, sans-serif", "baseline", "tokens.css"),
    registerToken("--mono", "var(--font-body), sans-serif", "baseline", "tokens.css"),
    registerToken("--ease", "cubic-bezier(0.22, 1, 0.36, 1)", "baseline", "tokens.css"),
    registerToken("--motion", "600ms", "baseline", "tokens.css"),
    // admin-workspace.module.css scoped tokens
    registerToken("--admin-bg", "#0d101b", "admin", "admin-workspace.module.css"),
    registerToken("--admin-panel", "#171c2b", "admin", "admin-workspace.module.css"),
    registerToken("--admin-border", "#ffffff1c", "admin", "admin-workspace.module.css"),
    registerToken("--admin-muted", "#aab3c8", "admin", "admin-workspace.module.css"),
  ];

  const rawHexes = new Set<string>();
  const rawRgbs = new Set<string>();
  const rawGradients = new Set<string>();
  const rawShadows = new Set<string>();
  const rawRadius = new Set<string>();
  const rawZIndexes = new Set<string>();

  for (const relPath of CSS_FILES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const css = fs.readFileSync(fullPath, "utf8");
    const root = postcssSafe(css);

    root.walkDecls((decl: PostcssDeclNode) => {
      const val = decl.value + (decl.important ? " !important" : "");
      const prop = decl.prop.toLowerCase();

      // Hex matches
      const hexMatches = val.match(HEX_COLOR_RE);
      if (hexMatches) {
        for (const h of hexMatches) {
          rawHexes.add(h.toLowerCase());
        }
      }

      // RGB matches
      const rgbMatches = val.match(RGB_COLOR_RE);
      if (rgbMatches) {
        for (const r of rgbMatches) {
          rawRgbs.add(r.trim());
        }
      }

      // Gradients
      const gradMatches = val.match(GRADIENT_RE);
      if (gradMatches) {
        for (const g of gradMatches) {
          rawGradients.add(g.replace(/\s+/g, " ").trim());
        }
      }

      // Shadows
      if ((prop.includes("shadow") || val.includes("drop-shadow")) && val !== "none") {
        rawShadows.add(val.replace(/\s+/g, " ").trim());
      }

      // Radius
      if (prop.includes("radius") && !prop.startsWith("--") && !val.includes("var(")) {
        rawRadius.add(val.replace(/\s+/g, " ").trim());
      }

      // z-index
      if (prop === "z-index") {
        rawZIndexes.add(val.trim());
      }
    });
  }

  // 1. Color tokens (Hex)
  const hexTokens: TokenEntry[] = [];
  for (const h of Array.from(rawHexes).sort()) {
    const cleanHex = h.slice(1);
    const tokenName = `--color-${cleanHex}`;
    hexTokens.push(registerToken(tokenName, h, "color-hex"));
  }

  // 2. Color tokens (RGB)
  const rgbTokens: TokenEntry[] = [];
  for (const r of Array.from(rawRgbs).sort()) {
    // e.g. rgb(255 195 219 / 50%) -> --color-rgb-255-195-219-50
    const slug = r
      .replace(/rgb\(/i, "")
      .replace(/\)/g, "")
      .replace(/[\s/]+/g, "-")
      .replace(/%/g, "")
      .replace(/--+/g, "-")
      .trim();
    const tokenName = `--color-rgb-${slug}`;
    rgbTokens.push(registerToken(tokenName, r, "color-rgb"));
  }

  // 3. Named color (white)
  const namedTokens: TokenEntry[] = [
    registerToken("--color-white", "white", "color-named"),
  ];

  // 4. Gradient tokens
  const gradientTokens: TokenEntry[] = [];
  const sortedGradients = Array.from(rawGradients).sort();
  for (let i = 0; i < sortedGradients.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    const tokenName = `--gradient-${num}`;
    gradientTokens.push(registerToken(tokenName, sortedGradients[i], "gradient"));
  }

  // 5. Shadow tokens
  const shadowTokens: TokenEntry[] = [];
  const sortedShadows = Array.from(rawShadows).sort();
  for (let i = 0; i < sortedShadows.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    const tokenName = `--shadow-${num}`;
    shadowTokens.push(registerToken(tokenName, sortedShadows[i], "shadow"));
  }

  // 6. Radius tokens
  const radiusTokens: TokenEntry[] = [];
  for (const r of Array.from(rawRadius).sort()) {
    const slug = r
      .replace(/px/g, "px")
      .replace(/%/g, "pct")
      .replace(/\./g, "-")
      .replace(/\s+/g, "-");
    const tokenName = `--radius-${slug}`;
    radiusTokens.push(registerToken(tokenName, r, "radius"));
  }

  // 7. Motion Durations and Easings
  const motionTokens: TokenEntry[] = [
    registerToken("--motion-35ms", "35ms", "duration"),
    registerToken("--motion-140ms", "140ms", "duration"),
    registerToken("--motion-180ms", "180ms", "duration"),
    registerToken("--motion-200ms", "200ms", "duration"),
    registerToken("--motion-250ms", "250ms", "duration"),
    registerToken("--motion-300ms", "300ms", "duration"),
    registerToken("--motion-350ms", "350ms", "duration"),
    registerToken("--motion-450ms", "450ms", "duration"),
    registerToken("--motion-500ms", "500ms", "duration"),
    registerToken("--motion-650ms", "650ms", "duration"),
    registerToken("--motion-700ms", "700ms", "duration"),
    registerToken("--motion-800ms", "800ms", "duration"),
    registerToken("--motion-900ms", "900ms", "duration"),
    registerToken("--motion-1000ms", "1000ms", "duration"),
    registerToken("--motion-1100ms", "1100ms", "duration"),
    registerToken("--motion-1200ms", "1200ms", "duration"),
    registerToken("--motion-6s", "6s", "duration"),
    registerToken("--ease-standard", "ease", "easing"),
    registerToken("--ease-linear", "linear", "easing"),
    registerToken("--ease-in-out", "ease-in-out", "easing"),
  ];

  // 8. z-index layers
  const zTokens: TokenEntry[] = [];
  const sortedZ = Array.from(rawZIndexes).sort((a, b) => Number(a) - Number(b));
  for (const z of sortedZ) {
    const slug = z.startsWith("-") ? `neg-${z.slice(1)}` : z;
    const tokenName = `--z-${slug}`;
    zTokens.push(registerToken(tokenName, z, "z-index"));
  }

  // Generate CSS string
  const lines: string[] = [
    `/*`,
    ` * ULUDOTT — Merkezi Tema Token Tanımları (Faz 1 — İş 1A)`,
    ` * Otomatik üretilmiştir. Mevcut tokens.css ve admin değişkenlerini kayıpsız içerir.`,
    ` * NOT: Bu dosya şimdilik HİÇBİR yerden import edilmez.`,
    ` * Kaynak: tests/fixtures/golden-declarations.json (Commit 1715682f396d1698871c6615766623cacb0d8405)`,
    ` */`,
    ``,
    `:root {`,
    `  /* --- Mevcut Temel Tokenlar (tokens.css) --- */`,
  ];

  for (const t of baselineTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Adlandırılmış Renkler --- */`);
  for (const t of namedTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Mekanik Hex Renk Tokenları (${hexTokens.length} adet) --- */`);
  for (const t of hexTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Mekanik RGB Renk Tokenları (${rgbTokens.length} adet) --- */`);
  for (const t of rgbTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Gradient Tokenları (${gradientTokens.length} adet) --- */`);
  for (const t of gradientTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Gölge Tokenları (${shadowTokens.length} adet) --- */`);
  for (const t of shadowTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Radius Tokenları (${radiusTokens.length} adet) --- */`);
  for (const t of radiusTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Süre ve Easing Tokenları (${motionTokens.length} adet) --- */`);
  for (const t of motionTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Katman / z-index Tokenları (${zTokens.length} adet) --- */`);
  for (const t of zTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(`}`, ``);
  return lines.join("\n");
}

function main() {
  const css = generateThemesCss();
  const outputPath = path.resolve(process.cwd(), "src/styles/themes.css");
  fs.writeFileSync(outputPath, css, "utf8");
  console.log(`Successfully generated themes.css at ${outputPath} (${css.split("\n").length} lines).`);
}

if (process.argv[1] && process.argv[1].endsWith("generate-themes.ts")) {
  main();
}
