import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { THEMES } from "../../src/config/theme.config.ts";
import { COOKIE_KEYS, STORAGE_KEYS } from "../../src/config/storage-keys.ts";
import { readThemeBlocks } from "../helpers/theme-css.ts";
import { sourceFiles } from "../helpers/theme-source.ts";

it("her THEMES kimliği aynı token kümesiyle ve alt ağaç seçicisiyle tanımlıdır", () => {
  const blocks = readThemeBlocks();
  expect([...blocks.keys()].sort()).toEqual([...THEMES].sort());
  const reference = [...(blocks.get(THEMES[0])?.keys() ?? [])].sort();
  expect(reference.length).toBeGreaterThan(100);
  for (const theme of THEMES) expect([...(blocks.get(theme)?.keys() ?? [])].sort()).toEqual(reference);
  const css = readFileSync("src/styles/themes.css", "utf8");
  expect(css).toMatch(/:root,\s*\[data-theme="arcade"\]/);
  expect(css).not.toMatch(/html\s*\[data-theme/);
  expect(css.match(/color-scheme:\s*dark;/g)).toHaveLength(THEMES.length);
});
it("src içindeki iç içe/fallback var() dahil bütün tokenlar tanımlıdır", () => {
  const defined = readThemeBlocks().get(THEMES[0]);
  const missing: string[] = [];
  for (const path of sourceFiles()) {
    const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of source.matchAll(/var\(\s*(--[\w-]+)/g)) if (!defined?.has(match[1])) missing.push(`${path}: ${match[1]}`);
  }
  expect(missing).toEqual([]);
});
it("yinelenen token/tema sessizce ezilmez", () => {
  expect(() => readThemeBlocks('[data-theme="arcade"] { --x: 1; --x: 2; }')).toThrow();
  expect(() => readThemeBlocks('[data-theme="arcade"] { --x: 1; } [data-theme="arcade"] { --x: 1; }')).toThrow();
});
it("storage anahtarları ve font sağlayıcı importu merkezi kaynak dışında tekrarlanmaz", () => {
  const errors: string[] = [];
  for (const path of sourceFiles()) {
    const source = readFileSync(path, "utf8");
    if (path !== "src/config/storage-keys.ts") for (const key of [...Object.values(STORAGE_KEYS), ...Object.values(COOKIE_KEYS)]) if (source.includes(key)) errors.push(`${path}: storage`);
    if (path !== "src/config/fonts.ts" && source.includes('from "next/font/google"')) errors.push(`${path}: font`);
  }
  expect(errors).toEqual([]);
});
