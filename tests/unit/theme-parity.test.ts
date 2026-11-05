import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcssSafe = require("next/dist/compiled/postcss-safe-parser");

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
  generatedAt: string;
  note: string;
  totalDeclarations: number;
  files: string[];
  declarations: GoldenDeclaration[];
}

interface PostcssNode {
  type: string;
  prop?: string;
  value?: string;
  important?: boolean;
  name?: string;
  params?: string;
  selector?: string;
  parent?: PostcssNode;
}

function readCssWithImports(filePath: string, visited = new Set<string>()): string {
  const absPath = path.resolve(filePath);
  if (visited.has(absPath)) {
    return "";
  }
  visited.add(absPath);
  const content = fs.readFileSync(absPath, "utf8");
  const root = postcssSafe(content);
  const chunks: string[] = [];

  for (const node of root.nodes ?? []) {
    if (node.type === "atrule" && node.name === "import") {
      const match = /["']([^"']+)["']/.exec(node.params ?? "");
      if (match) {
        const importedPath = path.resolve(path.dirname(absPath), match[1]);
        chunks.push(readCssWithImports(importedPath, visited));
        continue;
      }
    }
    chunks.push(node.toString());
  }

  return chunks.join("\n");
}

function parseTokensFromCss(cssContent: string): Map<string, string> {
  const root = postcssSafe(cssContent);
  const tokens = new Map<string, string>();
  root.walkDecls((decl: PostcssNode) => {
    if (decl.prop && decl.prop.startsWith("--")) {
      tokens.set(decl.prop, (decl.value ?? "").trim());
    }
  });
  return tokens;
}

function resolveWithTokens(value: string, tokenMap: Map<string, string>): string {
  // In golden-declarations.json (pre-1A commit 1715682f396d1698871c6615766623cacb0d8405),
  // next/font producer variables on <html> were named --font-body and --font-display.
  // In 1A, layout.tsx produces --font-artdeco-body and --font-artdeco-display on <html>,
  // and themes.css aliases --font-body: var(--font-artdeco-body) and --font-display: var(--font-artdeco-display).
  // Keep --font-body and --font-display as the terminal font-family aliases when comparing against golden-declarations.json.
  const resolutionMap = new Map(tokenMap);
  resolutionMap.delete("--font-body");
  resolutionMap.delete("--font-display");

  let prev = "";
  let curr = value;
  let iterations = 0;
  while (prev !== curr && iterations < 15) {
    prev = curr;
    iterations++;
    for (const [token, replacement] of resolutionMap.entries()) {
      const regex = new RegExp(`var\\(${token}\\)(?![\\w-])`, "g");
      curr = curr.replace(regex, replacement);
    }
  }
  return curr;
}

function normalizeCssValue(val: string): string {
  return val.replace(/\s+/g, " ").trim();
}

function getSelectorChain(decl: PostcssNode): string {
  const parts: string[] = [];
  let curr = decl.parent;
  while (curr && curr.type !== "root") {
    if (curr.type === "rule" && curr.selector) {
      parts.unshift(curr.selector.replace(/\s+/g, " ").trim());
    } else if (curr.type === "atrule" && curr.name) {
      parts.unshift(`@${curr.name} ${curr.params ?? ""}`.replace(/\s+/g, " ").trim());
    }
    curr = curr.parent;
  }
  return parts.join(" > ");
}

describe("Theme Parity Test Suite", () => {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/golden-declarations.json");
  const tokensCssPath = path.resolve(process.cwd(), "src/styles/tokens.css");
  const baseCssPath = path.resolve(process.cwd(), "src/styles/base.css");
  const themesCssPath = path.resolve(process.cwd(), "src/styles/themes.css");
  const layoutTsxPath = path.resolve(process.cwd(), "src/app/layout.tsx");

  it("validates golden declarations fixture metadata and coverage", () => {
    expect(fs.existsSync(fixturePath), "Fixture file must exist").toBe(true);
    const content = fs.readFileSync(fixturePath, "utf8");
    const payload: GoldenDeclarationsPayload = JSON.parse(content);

    expect(payload.version).toBe(1);
    expect(payload.sourceCommit).toBe("1715682f396d1698871c6615766623cacb0d8405");
    expect(payload.totalDeclarations).toBe(2889);
    expect(payload.declarations.length).toBe(2889);
    expect(payload.files.length).toBe(11);
  });

  it("ensures each token definition in themes.css maps to exactly one value without collision", () => {
    expect(fs.existsSync(themesCssPath), "themes.css must exist").toBe(true);
    expect(fs.existsSync(baseCssPath), "base.css must exist").toBe(true);

    const themesCss = fs.readFileSync(themesCssPath, "utf8");
    const tokensCssResolved = readCssWithImports(tokensCssPath);

    const themesTokens = parseTokensFromCss(themesCss);
    const tokensMap = parseTokensFromCss(tokensCssResolved);

    // Verify root & admin baseline tokens exist with identical values
    expect(themesTokens.get("--ink")).toBe("#0c0d1b");
    expect(themesTokens.get("--panel")).toBe("#18182c");
    expect(themesTokens.get("--cream")).toBe("#fff9cb");
    expect(themesTokens.get("--muted")).toBe("#cac4d7");
    expect(themesTokens.get("--purple")).toBe("#edb2e4");
    expect(themesTokens.get("--lime")).toBe("#f6b6cb");
    expect(themesTokens.get("--coral")).toBe("#ffbd9e");
    expect(themesTokens.get("--line")).toBe("#51495f");
    expect(themesTokens.get("--radius")).toBe("4px");
    expect(themesTokens.get("--space")).toBe("clamp(22px, 6vw, 100px)");
    expect(themesTokens.get("--font")).toBe("var(--font-body), Arial, sans-serif");
    expect(themesTokens.get("--heading")).toBe("var(--font-display), Impact, sans-serif");
    expect(themesTokens.get("--mono")).toBe("var(--font-body), sans-serif");
    expect(themesTokens.get("--ease")).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(themesTokens.get("--motion")).toBe("600ms");
    expect(themesTokens.get("--admin-bg")).toBe("#0d101b");
    expect(themesTokens.get("--admin-panel")).toBe("#171c2b");
    expect(themesTokens.get("--admin-border")).toBe("#ffffff1c");
    expect(themesTokens.get("--admin-muted")).toBe("#aab3c8");

    // Verify no duplicate conflicting names in themes.css
    const seen = new Map<string, string>();
    const root = postcssSafe(themesCss);
    root.walkDecls((decl: PostcssNode) => {
      if (decl.prop && decl.prop.startsWith("--")) {
        const val = (decl.value ?? "").trim().toLowerCase();
        if (seen.has(decl.prop)) {
          expect(seen.get(decl.prop)).toBe(val);
        } else {
          seen.set(decl.prop, val);
        }
      }
    });

    // Verify tokens.css (@import "./themes.css") exposes all themes.css tokens
    for (const [token, val] of themesTokens.entries()) {
      expect(tokensMap.get(token)).toBe(val);
    }
  });

  it("verifies atomic font variable separation between layout.tsx and themes.css without circular references", () => {
    const layoutSource = fs.readFileSync(layoutTsxPath, "utf8");
    expect(layoutSource).toContain('variable: "--font-artdeco-body"');
    expect(layoutSource).toContain('variable: "--font-artdeco-display"');
    expect(layoutSource).not.toContain('variable: "--font-body"');
    expect(layoutSource).not.toContain('variable: "--font-display"');

    const themesCss = fs.readFileSync(themesCssPath, "utf8");
    const themesTokens = parseTokensFromCss(themesCss);

    expect(themesTokens.get("--font-body")).toBe("var(--font-artdeco-body)");
    expect(themesTokens.get("--font-display")).toBe("var(--font-artdeco-display)");
    expect(themesTokens.get("--font-body")).not.toContain("var(--font-body)");
    expect(themesTokens.get("--font-display")).not.toContain("var(--font-display)");
  });

  it("resolves all 2,889 declarations across current CSS files against themes.css with 100% golden parity", () => {
    const fixtureContent = fs.readFileSync(fixturePath, "utf8");
    const payload: GoldenDeclarationsPayload = JSON.parse(fixtureContent);

    const themesCss = fs.readFileSync(themesCssPath, "utf8");
    const themesTokens = parseTokensFromCss(themesCss);

    // 1. Verify the 20 token & root declarations (16 from tokens.css :root + 4 --admin-* from admin-workspace.module.css)
    const goldenRootAndAdminTokens = payload.declarations.filter(
      (d) => (d.file === "src/styles/tokens.css" && d.selectorChain === ":root") || d.prop.startsWith("--admin-")
    );
    expect(goldenRootAndAdminTokens.length).toBe(20);

    for (const decl of goldenRootAndAdminTokens) {
      if (decl.prop === "color-scheme") {
        expect(themesCss).toContain("color-scheme: dark;");
      } else {
        expect(themesTokens.get(decl.prop)).toBe(decl.resolvedValue);
      }
    }

    // 2. Walk current transformed CSS files (base.css for tokens.css style rules, plus the other 10 CSS files)
    const goldenStyleDecls = payload.declarations.filter(
      (d) => !((d.file === "src/styles/tokens.css" && d.selectorChain === ":root") || d.prop.startsWith("--admin-"))
    );
    expect(goldenStyleDecls.length).toBe(2869);

    const currentStyleDecls: Array<{
      file: string;
      selectorChain: string;
      prop: string;
      rawValue: string;
      resolvedValue: string;
    }> = [];

    for (const relPath of payload.files) {
      const targetRelPath = relPath === "src/styles/tokens.css" ? "src/styles/base.css" : relPath;
      const fullPath = path.resolve(process.cwd(), targetRelPath);
      const cssContent = fs.readFileSync(fullPath, "utf8");
      const root = postcssSafe(cssContent);

      root.walkDecls((decl: PostcssNode) => {
        const prop = (decl.prop ?? "").toLowerCase();
        const rawValue = (decl.value ?? "") + (decl.important ? " !important" : "");
        const resolvedValue = resolveWithTokens(rawValue, themesTokens);
        currentStyleDecls.push({
          file: relPath,
          selectorChain: getSelectorChain(decl),
          prop,
          rawValue,
          resolvedValue,
        });
      });
    }

    expect(currentStyleDecls.length).toBe(goldenStyleDecls.length);

    let verifiedCount = goldenRootAndAdminTokens.length;
    for (let i = 0; i < goldenStyleDecls.length; i++) {
      const golden = goldenStyleDecls[i];
      const current = currentStyleDecls[i];

      expect(current.file).toBe(golden.file);
      expect(current.selectorChain).toBe(golden.selectorChain);
      expect(current.prop).toBe(golden.prop);
      expect(normalizeCssValue(current.resolvedValue)).toBe(normalizeCssValue(golden.resolvedValue));
      verifiedCount++;
    }

    expect(verifiedCount).toBe(2889);
  });
});
