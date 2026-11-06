import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcssSafe = require("next/dist/compiled/postcss-safe-parser");

interface PostcssNode {
  type: string;
  prop?: string;
  value?: string;
  important?: boolean;
  name?: string;
  params?: string;
  selector?: string;
  parent?: PostcssNode;
  source?: { start?: { line?: number } };
}

/**
 * Documented runtime custom properties (Plan İş 1A line 120):
 * Dynamic values computed at runtime via JS (scroll ratio, pointer coordinates, staggered index, active scene sky).
 */
export const ALLOWED_RUNTIME_CUSTOM_PROPERTIES = new Set<string>([
  "--menu-index",
  "--glow-x",
  "--glow-y",
  "--page-scroll",
  "--scene-bg",
]);

/**
 * Producer variables emitted on <html> by next/font/local in src/app/layout.tsx (Plan İş 1A line 119).
 */
export const ALLOWED_NEXT_FONT_PRODUCER_VARIABLES = new Set<string>([
  "--font-artdeco-body",
  "--font-artdeco-display",
]);

/**
 * Narrow, file+reason audited exception manifest for non-CSS files (Plan İş 1A line 121 & Rule 2).
 * Never exempts whole directories like src/modules or src/lib.
 */
export interface AuditedColorException {
  file: string;
  allowedLiterals: readonly string[];
  category: "backend-image" | "wallet-payload" | "runtime-scene-sky";
  reason: string;
}

export const AUDITED_COLOR_EXCEPTION_MANIFEST: readonly AuditedColorException[] = [
  {
    file: "src/modules/media/infrastructure/process-image.ts",
    allowedLiterals: ["#f4efdf"],
    category: "backend-image",
    reason: "Sharp sunucu tarafı JPEG alpha-flatten arka plan rengi; tarayıcı UI rengi değildir.",
  },
  {
    file: "src/modules/wallet/google/google-pass.ts",
    allowedLiterals: ["#19202B"],
    category: "wallet-payload",
    reason: "Google Wallet API pass JSON hexBackgroundColor alanı; tarayıcı CSS değişkeni kabul etmez.",
  },
  {
    file: "src/app/page.tsx",
    allowedLiterals: ["#24223b", "#17303c", "#223b45", "#3e2b40", "#262943"],
    category: "runtime-scene-sky",
    reason: "v0.1 DOM data-sky sahne veri özniteliği (--scene-bg çalışma anı scroll-motion girdisi; themes.css içinde --sky-* olarak kayıtlı).",
  },
  {
    file: "src/app/(public)/hakkimizda/page.tsx",
    allowedLiterals: ["#293646"],
    category: "runtime-scene-sky",
    reason: "v0.1 DOM data-sky sahne veri özniteliği (--scene-bg çalışma anı scroll-motion girdisi; themes.css içinde --sky-* olarak kayıtlı).",
  },
  {
    file: "src/app/(public)/fanzin/page.tsx",
    allowedLiterals: ["#24223b", "#192437"],
    category: "runtime-scene-sky",
    reason: "Fanzin DOM data-sky sahne veri özniteliği (--scene-bg çalışma anı scroll-motion girdisi; themes.css içinde --sky-* olarak kayıtlı).",
  },
  {
    file: "src/components/layout/story-panels.tsx",
    allowedLiterals: ["#192437"],
    category: "runtime-scene-sky",
    reason: "v0.1 DOM data-sky sahne veri özniteliği (--scene-bg çalışma anı scroll-motion girdisi; themes.css içinde --sky-* olarak kayıtlı).",
  },
  {
    file: "src/components/layout/scroll-motion.tsx",
    allowedLiterals: ["#0c0d1b", "#213949", "#382e40", "#313929"],
    category: "runtime-scene-sky",
    reason: "--scene-bg çalışma anı scroll-motion sahne renk dizisi ve varsayılanı (themes.css içinde --sky-* olarak kayıtlı).",
  },
  {
    file: "src/modules/community/people-reference-data.ts",
    allowedLiterals: ["#171923", "#282338", "#213949", "#382e40", "#313929"],
    category: "runtime-scene-sky",
    reason: "People referans veri modeli chapter.color -> data-sky sahne veri özniteliği (themes.css içinde --sky-* olarak kayıtlı).",
  },
] as const;

/**
 * Documented CSS @media breakpoint queries inventory (Rule 2 & Plan İş 1A line 120).
 */
export const DOCUMENTED_MEDIA_QUERIES = new Set<string>([
  "(max-height: 500px)",
  "(max-width: 1000px)",
  "(max-width: 1100px)",
  "(max-width: 1150px)",
  "(max-width: 430px)",
  "(max-width: 560px)",
  "(max-width: 620px)",
  "(max-width: 640px)",
  "(max-width: 699px)",
  "(max-width: 760px)",
  "(max-width: 780px)",
  "(max-width: 900px)",
  "(max-width: 930px)",
  "(prefers-reduced-motion: no-preference)",
  "(prefers-reduced-motion: reduce)",
]);

const CSS_NAMED_COLORS = new Set<string>([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black",
  "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
  "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
  "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen",
  "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
  "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
  "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
  "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred",
  "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
  "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey",
  "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon",
  "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue",
  "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab",
  "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
  "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple",
  "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell",
  "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen",
  "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white",
  "whitesmoke", "yellow", "yellowgreen",
]);

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const FUNC_COLOR_RE = /\b(?:rgb|rgba|hsl|hsla|oklab|oklch|lab|lch|hwb|color|color-mix|light-dark)\s*\([^)]*\)/gi;

export function findColorViolationsInCssValue(value: string): string[] {
  const violations: string[] = [];

  // 1. Check var(--token, fallback) for hardcoded color fallbacks
  const varWithFallbackRe = /var\(\s*--[a-zA-Z0-9_-]+\s*,\s*([^)]+)\)/g;
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varWithFallbackRe.exec(value)) !== null) {
    const fallback = varMatch[1].trim();
    const fallbackColors = findDirectColorLiterals(fallback);
    for (const c of fallbackColors) {
      violations.push(`fallback-color:${c}`);
    }
  }

  // 2. Strip var(...) expressions (including fallbacks already inspected) and custom prop names before checking direct literals
  const withoutVarNames = value
    .replace(varWithFallbackRe, "")
    .replace(/--[a-zA-Z0-9_-]+/g, "");
  violations.push(...findDirectColorLiterals(withoutVarNames));

  return violations;
}

function findDirectColorLiterals(input: string): string[] {
  const hits: string[] = [];

  const hexMatches = input.match(HEX_COLOR_RE);
  if (hexMatches) {
    hits.push(...hexMatches);
  }

  const funcMatches = input.match(FUNC_COLOR_RE);
  if (funcMatches) {
    hits.push(...funcMatches);
  }

  // Tokenize words outside custom property identifiers to check named CSS colors
  const wordRe = /(?<![\w-])([a-zA-Z]+)(?![\w-(])/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordRe.exec(input)) !== null) {
    const word = wordMatch[1].toLowerCase();
    if (CSS_NAMED_COLORS.has(word)) {
      hits.push(wordMatch[1]);
    }
  }

  return hits;
}

export function scanCssAstForViolations(
  cssContent: string,
  filePath: string,
  themesTokens: Map<string, string>,
  isThemesFile = false
): string[] {
  const errors: string[] = [];
  const root = postcssSafe(cssContent);

  root.walkDecls((decl: PostcssNode) => {
    const prop = decl.prop ?? "";
    const val = (decl.value ?? "") + (decl.important ? " !important" : "");
    const line = decl.source?.start?.line ?? 0;

    if (!isThemesFile && prop.startsWith("--")) {
      errors.push(`${filePath}:${line} unauthorized custom property definition "${prop}" outside themes.css`);
    }

    if (!isThemesFile) {
      const colorViolations = findColorViolationsInCssValue(val);
      for (const v of colorViolations) {
        errors.push(`${filePath}:${line} forbidden color literal "${v}" in "${prop}: ${val}"`);
      }
    }

    // Check all var(--...) usages
    const varRe = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = varRe.exec(val)) !== null) {
      const varName = m[1];
      const isDefinedInThemes = themesTokens.has(varName);
      const isRuntimeProp = !isThemesFile && ALLOWED_RUNTIME_CUSTOM_PROPERTIES.has(varName);
      const isNextFontProducer = ALLOWED_NEXT_FONT_PRODUCER_VARIABLES.has(varName);

      if (!isDefinedInThemes && !isRuntimeProp && !isNextFontProducer) {
        errors.push(`${filePath}:${line} undefined CSS custom property reference "${varName}"`);
      }
    }
  });

  return errors;
}

export function detectTokenCycles(tokenMap: Map<string, string>): string[] {
  const cycles: string[] = [];
  const varRe = /var\(\s*(--[a-zA-Z0-9_-]+)/g;

  for (const startToken of tokenMap.keys()) {
    const visited = new Set<string>();
    const stack: string[] = [startToken];

    function dfs(current: string) {
      visited.add(current);
      const raw = tokenMap.get(current);
      if (!raw) return;

      const refs: string[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(varRe.source, "g");
      while ((m = re.exec(raw)) !== null) {
        refs.push(m[1]);
      }

      for (const next of refs) {
        if (stack.includes(next)) {
          cycles.push([...stack, next].join(" -> "));
          return;
        }
        if (!visited.has(next) && tokenMap.has(next)) {
          stack.push(next);
          dfs(next);
          stack.pop();
        }
      }
    }

    dfs(startToken);
  }

  return cycles;
}

export function extractColorsFromSourceCode(sourceContent: string): string[] {
  // 1. Strip href fragments (e.g., href="#kesfet", href="/oyunlar#derece-oyunlari", href={`/hakkimizda#people-${...}`)
  const cleaned = sourceContent
    .replace(/\bhref\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, "")
    // Strip path#fragment strings inside arrays/tuples like ["/hakkimizda#yonetim-kurulu", ...]
    .replace(/(["'`])\/[a-zA-Z0-9/_-]*#[a-zA-Z0-9_-]+\1/g, "")
    // Strip standard UUIDs
    .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, "")
    // Strip 40-char SHA-1 and 64-char SHA-256 hex digests
    .replace(/\b[0-9a-fA-F]{64}\b/g, "")
    .replace(/\b[0-9a-fA-F]{40}\b/g, "");

  const hits: string[] = [];

  // Hex literals (#3, #4, #6, #8)
  const hexes = cleaned.match(HEX_COLOR_RE);
  if (hexes) {
    hits.push(...hexes);
  }

  // Functional colors (rgb, rgba, hsl, hsla, oklab, oklch, etc.)
  const funcs = cleaned.match(FUNC_COLOR_RE);
  if (funcs) {
    hits.push(...funcs);
  }

  // Named colors inside style objects or SVG presentation attributes (color/background/fill/stroke)
  const styleNamedRe = /\b(?:color|background|backgroundColor|borderColor|outlineColor|fill|stroke)\s*[:=]\s*["']([a-zA-Z]+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = styleNamedRe.exec(cleaned)) !== null) {
    const candidate = m[1].toLowerCase();
    if (CSS_NAMED_COLORS.has(candidate)) {
      hits.push(m[1]);
    }
  }

  // Hardcoded fallback colors in var(--token, <fallback>) inside TS/TSX
  const varFallbackRe = /var\(\s*--[a-zA-Z0-9_-]+\s*,\s*([^)]+)\)/g;
  while ((m = varFallbackRe.exec(cleaned)) !== null) {
    const fbColors = findDirectColorLiterals(m[1]);
    hits.push(...fbColors.map((c) => `fallback-color:${c}`));
  }

  return hits;
}

function walkFiles(dir: string, predicate: (file: string) => boolean, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

describe("Theme Centralization Guard Suite (Faz 1 — İş 1A)", () => {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, "src");
  const themesCssPath = path.join(srcDir, "styles/themes.css");
  const themesCss = fs.readFileSync(themesCssPath, "utf8");

  const themesTokens = new Map<string, string>();
  const themesRoot = postcssSafe(themesCss);
  themesRoot.walkDecls((decl: PostcssNode) => {
    if (decl.prop && decl.prop.startsWith("--")) {
      themesTokens.set(decl.prop, (decl.value ?? "").trim());
    }
  });

  it("ensures themes.css has no undefined var() references and zero circular token dependencies", () => {
    const errors = scanCssAstForViolations(themesCss, "src/styles/themes.css", themesTokens, true);
    expect(errors).toEqual([]);

    const cycles = detectTokenCycles(themesTokens);
    expect(cycles).toEqual([]);
  });

  it("forbids browser UI colors and local token definitions in all CSS files outside src/styles/themes.css", () => {
    const cssFiles = walkFiles(srcDir, (f) => f.endsWith(".css"));
    expect(cssFiles.length).toBe(18); // themes.css + base.css + tokens.css + cinematic.css + home.module.css + 13 module.css files

    const allErrors: string[] = [];
    for (const fullPath of cssFiles) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      if (relPath === "src/styles/themes.css") continue;

      const content = fs.readFileSync(fullPath, "utf8");
      const fileErrors = scanCssAstForViolations(content, relPath, themesTokens, false);
      allErrors.push(...fileErrors);
    }

    expect(allErrors).toEqual([]);
  });

  it("verifies all @media queries across CSS files match the documented breakpoint & motion inventory", () => {
    const cssFiles = walkFiles(srcDir, (f) => f.endsWith(".css"));
    const undocumented: string[] = [];

    for (const fullPath of cssFiles) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      const content = fs.readFileSync(fullPath, "utf8");
      const root = postcssSafe(content);

      root.walkAtRules("media", (rule: PostcssNode) => {
        const params = (rule.params ?? "").replace(/\s+/g, " ").trim();
        if (!DOCUMENTED_MEDIA_QUERIES.has(params)) {
          undocumented.push(`${relPath}: @media ${params}`);
        }
      });
    }

    expect(undocumented).toEqual([]);
  });

  it("scans all .ts and .tsx files in src/ (including src/modules and src/lib) and enforces the narrow exception manifest", () => {
    const tsFiles = walkFiles(srcDir, (f) => /\.(ts|tsx)$/.test(f));
    // Ensure src/modules and src/lib are actively scanned (never excluded)
    expect(tsFiles.some((f) => f.includes(path.join("src", "modules")))).toBe(true);
    expect(tsFiles.some((f) => f.includes(path.join("src", "lib")))).toBe(true);

    const manifestByFile = new Map<string, AuditedColorException>();
    for (const entry of AUDITED_COLOR_EXCEPTION_MANIFEST) {
      expect(entry.reason.trim().length).toBeGreaterThan(10);
      manifestByFile.set(entry.file, entry);

      // Every runtime-scene-sky literal must also be registered in themes.css as --sky-<hex>
      if (entry.category === "runtime-scene-sky") {
        for (const lit of entry.allowedLiterals) {
          const skyToken = `--sky-${lit.slice(1).toLowerCase()}`;
          expect(themesTokens.get(skyToken)).toBe(lit.toLowerCase());
        }
      }
    }

    const unexpectedViolations: string[] = [];
    const matchedManifestFiles = new Set<string>();

    for (const fullPath of tsFiles) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      const content = fs.readFileSync(fullPath, "utf8");
      const detectedColors = extractColorsFromSourceCode(content);

      if (detectedColors.length === 0) continue;

      const exception = manifestByFile.get(relPath);
      if (!exception) {
        unexpectedViolations.push(`${relPath}: unauthorized colors [${detectedColors.join(", ")}]`);
        continue;
      }

      matchedManifestFiles.add(relPath);
      const allowedSet = new Set(exception.allowedLiterals.map((c) => c.toLowerCase()));
      for (const c of detectedColors) {
        if (!allowedSet.has(c.toLowerCase())) {
          unexpectedViolations.push(`${relPath}: color "${c}" is not in audited exception allowlist`);
        }
      }
    }

    expect(unexpectedViolations).toEqual([]);
    // Ensure no stale entries exist in AUDITED_COLOR_EXCEPTION_MANIFEST
    expect(Array.from(matchedManifestFiles).sort()).toEqual(
      AUDITED_COLOR_EXCEPTION_MANIFEST.map((e) => e.file).sort()
    );
  });

  it("does NOT false-positive on href fragments, CSS ID selectors, UUIDs, or SHA digests, and catches real violations", () => {
    // 1. False-positive immunity in CSS selectors and TS/TSX strings
    const safeCss = `
      #main-content, #facade, #dead01, a[href="#beef"] {
        color: var(--cream);
        background: transparent;
        border-color: currentColor;
        transform: translate(var(--glow-x, 0px), var(--glow-y, 0px));
      }
    `;
    expect(scanCssAstForViolations(safeCss, "fixture-safe.css", themesTokens, false)).toEqual([]);

    const safeTsx = `
      const commitSha = "1715682f396d1698871c6615766623cacb0d8405";
      const sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const nav = ["/hakkimizda#cafe", "/oyunlar#beef01"];
      export function LinkFixture() {
        return <a href="#deadbeef">Keşfet</a>;
      }
    `;
    expect(extractColorsFromSourceCode(safeTsx)).toEqual([]);

    // 2. Positive detection of forbidden color formats, fallbacks, undefined vars, and cycles
    const violatingCss = `
      .bad {
        color: #fff;
        background: rgb(255 255 255 / 10%);
        border-color: hsl(120, 100%, 50%);
        outline-color: oklch(0.7 0.15 180);
        fill: white;
        box-shadow: 0 0 10px var(--ink, #0c0d1b);
        z-index: var(--missing-token);
      }
    `;
    const cssErrors = scanCssAstForViolations(violatingCss, "fixture-bad.css", themesTokens, false);
    expect(cssErrors).toEqual([
      'fixture-bad.css:3 forbidden color literal "#fff" in "color: #fff"',
      'fixture-bad.css:4 forbidden color literal "rgb(255 255 255 / 10%)" in "background: rgb(255 255 255 / 10%)"',
      'fixture-bad.css:5 forbidden color literal "hsl(120, 100%, 50%)" in "border-color: hsl(120, 100%, 50%)"',
      'fixture-bad.css:6 forbidden color literal "oklch(0.7 0.15 180)" in "outline-color: oklch(0.7 0.15 180)"',
      'fixture-bad.css:7 forbidden color literal "white" in "fill: white"',
      'fixture-bad.css:8 forbidden color literal "fallback-color:#0c0d1b" in "box-shadow: 0 0 10px var(--ink, #0c0d1b)"',
      'fixture-bad.css:9 undefined CSS custom property reference "--missing-token"',
    ]);

    const cyclicMap = new Map<string, string>([
      ["--font-body", "var(--font-body)"],
      ["--token-a", "var(--token-b)"],
      ["--token-b", "var(--token-a)"],
    ]);
    const cycles = detectTokenCycles(cyclicMap);
    expect(cycles).toContain("--font-body -> --font-body");
    expect(cycles).toContain("--token-a -> --token-b -> --token-a");
  });
});
