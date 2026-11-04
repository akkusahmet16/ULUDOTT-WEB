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

interface PostcssDecl {
  prop: string;
  value: string;
  important?: boolean;
}

function parseTokensFromCss(cssContent: string): Map<string, string> {
  const root = postcssSafe(cssContent);
  const tokens = new Map<string, string>();
  root.walkDecls((decl: PostcssDecl) => {
    if (decl.prop.startsWith("--")) {
      tokens.set(decl.prop, decl.value.trim());
    }
  });
  return tokens;
}

function resolveWithTokens(value: string, tokenMap: Map<string, string>): string {
  let prev = "";
  let curr = value;
  let iterations = 0;
  while (prev !== curr && iterations < 15) {
    prev = curr;
    iterations++;
    for (const [token, replacement] of tokenMap.entries()) {
      const regex = new RegExp(`var\\(${token}\\)`, "g");
      curr = curr.replace(regex, replacement);
    }
  }
  return curr;
}

describe("Theme Parity Test Suite", () => {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/golden-declarations.json");
  const tokensCssPath = path.resolve(process.cwd(), "src/styles/tokens.css");
  const adminCssPath = path.resolve(process.cwd(), "src/modules/admin/ui/admin-workspace.module.css");
  const themesCssPath = path.resolve(process.cwd(), "src/styles/themes.css");

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

  it("ensures each token definition maps to exactly one value without collision", () => {
    const tokensCss = fs.readFileSync(tokensCssPath, "utf8");
    const adminCss = fs.readFileSync(adminCssPath, "utf8");

    const tokensMap = parseTokensFromCss(tokensCss);
    const adminTokens = parseTokensFromCss(adminCss);

    // Merge into combined map
    for (const [k, v] of adminTokens.entries()) {
      tokensMap.set(k, v);
    }

    // Verify root tokens exist
    expect(tokensMap.get("--ink")).toBe("#0c0d1b");
    expect(tokensMap.get("--cream")).toBe("#fff9cb");
    expect(tokensMap.get("--lime")).toBe("#f6b6cb");
    expect(tokensMap.get("--radius")).toBe("4px");

    // If themes.css exists, verify its tokens as well
    if (fs.existsSync(themesCssPath)) {
      const themesCss = fs.readFileSync(themesCssPath, "utf8");
      const themesTokens = parseTokensFromCss(themesCss);

      // Verify no duplicate conflicting names
      const seen = new Map<string, string>();
      const root = postcssSafe(themesCss);
      root.walkDecls((decl: PostcssDecl) => {
        if (decl.prop.startsWith("--")) {
          const val = decl.value.trim().toLowerCase();
          if (seen.has(decl.prop)) {
            expect(seen.get(decl.prop)).toBe(val);
          } else {
            seen.set(decl.prop, val);
          }
        }
      });

      // Verify all baseline tokens from tokens.css exist in themes.css without loss
      for (const [token] of tokensMap.entries()) {
        expect(themesTokens.has(token), `themes.css must preserve token: ${token}`).toBe(true);
      }
    }
  });

  it("resolves all golden declarations against tokens.css and verifies 100% parity", () => {
    const fixtureContent = fs.readFileSync(fixturePath, "utf8");
    const payload: GoldenDeclarationsPayload = JSON.parse(fixtureContent);

    const tokensCss = fs.readFileSync(tokensCssPath, "utf8");
    const adminCss = fs.readFileSync(adminCssPath, "utf8");
    const tokensMap = parseTokensFromCss(tokensCss);
    const adminTokens = parseTokensFromCss(adminCss);
    for (const [k, v] of adminTokens.entries()) {
      tokensMap.set(k, v);
    }

    let resolvedMatches = 0;
    for (const decl of payload.declarations) {
      const resolved = resolveWithTokens(decl.rawValue, tokensMap);
      expect(resolved).toBe(decl.resolvedValue);
      resolvedMatches++;
    }

    expect(resolvedMatches).toBe(2889);
  });

  it("verifies themes.css parity when present", () => {
    if (!fs.existsSync(themesCssPath)) {
      // themes.css not yet generated; passing as expected per step 3 instructions
      return;
    }

    const themesCss = fs.readFileSync(themesCssPath, "utf8");
    const themesTokens = parseTokensFromCss(themesCss);

    const fixtureContent = fs.readFileSync(fixturePath, "utf8");
    const payload: GoldenDeclarationsPayload = JSON.parse(fixtureContent);

    // Any tokens mapped in themes.css must resolve consistently
    for (const decl of payload.declarations) {
      const resolvedAgainstThemes = resolveWithTokens(decl.rawValue, themesTokens);
      expect(resolvedAgainstThemes).toBe(decl.resolvedValue);
    }
  });
});
