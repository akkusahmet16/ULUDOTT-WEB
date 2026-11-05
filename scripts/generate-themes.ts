import fs from "node:fs";
import path from "node:path";

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const RGB_COLOR_RE = /\b(?:rgb|rgba)\([^)]+\)/g;
const GRADIENT_RE = /\b(?:linear-gradient|radial-gradient|conic-gradient)\([^;}]+\)/g;

interface TokenEntry {
  name: string;
  value: string;
  category: string;
  comment?: string;
}

interface GoldenDeclaration {
  sourceOrder: number;
  file: string;
  line: number;
  selectorChain: string;
  prop: string;
  rawValue: string;
  resolvedValue: string;
}

interface GoldenDeclarationsPayload {
  version: number;
  sourceCommit: string;
  declarations: GoldenDeclaration[];
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

  const fontAliasTokens: TokenEntry[] = [
    registerToken("--font-body", "var(--font-artdeco-body)", "font-alias", "next/font/local body alias"),
    registerToken("--font-display", "var(--font-artdeco-display)", "font-alias", "next/font/local display alias"),
  ];

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
    // admin-workspace.module.css scoped tokens (classic / admin)
    registerToken("--admin-bg", "#0d101b", "admin", "admin-workspace.module.css"),
    registerToken("--admin-panel", "#171c2b", "admin", "admin-workspace.module.css"),
    registerToken("--admin-border", "#ffffff1c", "admin", "admin-workspace.module.css"),
    registerToken("--admin-muted", "#aab3c8", "admin", "admin-workspace.module.css"),
  ];

  const skyTokens: TokenEntry[] = [
    registerToken("--sky-0c0d1b", "#0c0d1b", "sky"),
    registerToken("--sky-171923", "#171923", "sky"),
    registerToken("--sky-17303c", "#17303c", "sky"),
    registerToken("--sky-192437", "#192437", "sky"),
    registerToken("--sky-213949", "#213949", "sky"),
    registerToken("--sky-223b45", "#223b45", "sky"),
    registerToken("--sky-24223b", "#24223b", "sky"),
    registerToken("--sky-262943", "#262943", "sky"),
    registerToken("--sky-282338", "#282338", "sky"),
    registerToken("--sky-293646", "#293646", "sky"),
    registerToken("--sky-313929", "#313929", "sky"),
    registerToken("--sky-382e40", "#382e40", "sky"),
    registerToken("--sky-3e2b40", "#3e2b40", "sky"),
  ];

  const rawHexes = new Set<string>();
  const rawRgbs = new Set<string>();
  const rawGradients = new Set<string>();
  const rawShadows = new Set<string>();
  const rawRadius = new Set<string>();
  const rawZIndexes = new Set<string>();

  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/golden-declarations.json");
  const payload: GoldenDeclarationsPayload = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  for (const decl of payload.declarations) {
    const val = decl.rawValue;
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
    registerToken("--motion-1s", "1s", "duration"),
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
    ` * Kaynak: tests/fixtures/golden-declarations.json (Commit 1715682f396d1698871c6615766623cacb0d8405)`,
    ` */`,
    ``,
    `:root,`,
    `[data-theme="cinematic"],`,
    `[data-theme="classic"] {`,
    `  color-scheme: dark;`,
    ``,
    `  /* --- next/font/local Tasarım Takma Adları (Döngüsüz) --- */`,
  ];

  for (const t of fontAliasTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Mevcut Temel ve Admin Tokenlar (tokens.css + admin-workspace.module.css) --- */`);
  for (const t of baselineTokens) {
    lines.push(`  ${t.name}: ${t.value};`);
  }

  lines.push(``, `  /* --- Sahne Gökyüzü (data-sky / scroll-motion) Paleti (${skyTokens.length} adet) --- */`);
  for (const t of skyTokens) {
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
