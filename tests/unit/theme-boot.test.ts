import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";
import { BOOT_SCRIPT } from "../../src/config/boot-script.ts";
import { ADMIN_THEME, DEFAULT_THEME, THEMES, THEME_REGISTRY, isThemeId } from "../../src/config/theme.config.ts";
import { STORAGE_KEYS } from "../../src/config/storage-keys.ts";

it("registry tamdır ve sınır değerleri yalnız beyaz listedeki tema kimliklerini kabul eder", () => {
  expect(Object.keys(THEME_REGISTRY).sort()).toEqual([...THEMES].sort());
  expect(isThemeId(ADMIN_THEME)).toBe(true);
  for (const theme of THEMES) expect(isThemeId(theme)).toBe(true);
  for (const value of [null, undefined, 1, {}, [], "", "ARCADE", "<script>", "unknown"]) expect(isThemeId(value)).toBe(false);
});
it.each(THEMES)("boot %s tercihini HTML ayrıştırılırken doğrular ve uygular", theme => {
  const document = { documentElement: { dataset: { theme: "" } } };
  runInNewContext(BOOT_SCRIPT, { document, localStorage: { getItem(key: string) { expect(key).toBe(STORAGE_KEYS.theme); return theme; } } });
  expect(document.documentElement.dataset.theme).toBe(theme);
});
it.each([null, "unknown", "<script>"])("boot geçersiz %s değerinde varsayılanı uygular", value => {
  const document = { documentElement: { dataset: { theme: "" } } };
  runInNewContext(BOOT_SCRIPT, { document, localStorage: { getItem: () => value } });
  expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
});
it("storage nesnesine erişim bile throw ederse varsayılanla devam eder", () => {
  const document = { documentElement: { dataset: { theme: "" } } };
  const context = { document, get localStorage(): never { throw Error("SecurityError"); } };
  expect(() => runInNewContext(BOOT_SCRIPT, context)).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe(DEFAULT_THEME);
});
