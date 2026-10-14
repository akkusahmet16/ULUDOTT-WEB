import { expect, it } from "vitest";
import { contrast, readThemeBlocks, resolveHex } from "../helpers/theme-css.ts";
import { THEMES } from "../../src/config/theme.config.ts";

const pairs = [
  ["text", "bg", 4.5], ["text", "surface", 4.5],
  ["text-muted", "bg", 4.5], ["text-muted", "surface", 4.5],
  ["primary-contrast", "primary", 4.5], ["secondary-contrast", "secondary", 4.5], ["accent-contrast", "accent", 4.5],
  ["primary", "bg", 3], ["secondary", "bg", 3], ["focus", "bg", 3], ["border-strong", "bg", 3],
  // Gerçek kontroller panel üzerinde de çizilir; yalnız bg oranı yeterli değildir.
  ["border-strong", "surface", 3],
] as const;

for (const theme of THEMES) {
  it.each(pairs)(`${theme}: %s / %s kontrastı ≥%s`, (foreground, background, minimum) => {
    const tokens = readThemeBlocks().get(theme);
    if (!tokens) throw Error(`Tema bloğu yok: ${theme}`);
    expect(contrast(resolveHex(tokens, `--color-${foreground}`), resolveHex(tokens, `--color-${background}`))).toBeGreaterThanOrEqual(minimum);
  });
}
