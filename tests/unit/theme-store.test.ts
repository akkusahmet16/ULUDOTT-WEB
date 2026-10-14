import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getThemeSnapshot, restoreSavedTheme, setTheme, subscribeTheme } from "../../src/components/theme/theme-store.ts";
import { DEFAULT_THEME, THEMES } from "../../src/config/theme.config.ts";
import { STORAGE_KEYS } from "../../src/config/storage-keys.ts";

const alternate = THEMES.find(theme => theme !== DEFAULT_THEME);
if (!alternate) throw Error("Senkronizasyon testi ikinci tema gerektirir");
const element = { dataset: { theme: "" } };
const values = new Map<string, string>();
const storage = { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }) };
let target: EventTarget;
beforeEach(() => {
  values.clear();
  storage.getItem.mockClear();
  storage.setItem.mockClear();
  element.dataset.theme = DEFAULT_THEME;
  target = Object.assign(new EventTarget(), { localStorage: storage });
  vi.stubGlobal("window", target);
  vi.stubGlobal("document", { documentElement: element });
  vi.stubGlobal("MutationObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { vi.unstubAllGlobals(); });

it("setTheme DOM'u/persistansı birlikte günceller; unsubscribe bildirimleri keser", () => {
  const notify = vi.fn();
  const unsubscribe = subscribeTheme(notify);
  setTheme(alternate);
  expect(getThemeSnapshot()).toBe(alternate);
  expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.theme, alternate);
  expect(notify).toHaveBeenCalled();
  unsubscribe();
  notify.mockClear();
  setTheme(DEFAULT_THEME);
  expect(notify).not.toHaveBeenCalled();
});
it("diğer sekmenin storage değişimi ve silmesi DOM anlık görüntüsüne yansır", () => {
  const unsubscribe = subscribeTheme(() => {});
  target.dispatchEvent(Object.assign(new Event("storage"), { key: STORAGE_KEYS.theme, newValue: alternate }));
  expect(getThemeSnapshot()).toBe(alternate);
  target.dispatchEvent(Object.assign(new Event("storage"), { key: "unrelated", newValue: DEFAULT_THEME }));
  expect(getThemeSnapshot()).toBe(alternate);
  target.dispatchEvent(Object.assign(new Event("storage"), { key: STORAGE_KEYS.theme, newValue: null }));
  expect(getThemeSnapshot()).toBe(DEFAULT_THEME);
  unsubscribe();
});
it("kalıcı depo kullanılamasa da DOM teması değişir; restore varsayılana döner", () => {
  storage.setItem.mockImplementationOnce(() => { throw Error("SecurityError"); });
  expect(() => setTheme(alternate)).not.toThrow();
  expect(getThemeSnapshot()).toBe(alternate);
  storage.getItem.mockImplementationOnce(() => { throw Error("SecurityError"); });
  expect(() => restoreSavedTheme()).not.toThrow();
  expect(getThemeSnapshot()).toBe(DEFAULT_THEME);
});
it("JavaScript sınırından geçersiz tema gelirse DOM ve depo değişmez", () => {
  Reflect.apply(setTheme, undefined, ["unknown"]);
  expect(getThemeSnapshot()).toBe(DEFAULT_THEME);
  expect(storage.setItem).not.toHaveBeenCalled();
});
