import { DEFAULT_THEME, THEMES } from "./theme.config.ts";
import { STORAGE_KEYS } from "./storage-keys.ts";

// JSON yalnız merkezi sabitlerden üretilir; script kapanışı oluşturamaz.
const serialize = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export const BOOT_SCRIPT = `(function(){try{var theme=${serialize(DEFAULT_THEME)};try{var saved=localStorage.getItem(${serialize(STORAGE_KEYS.theme)});if(${serialize(THEMES)}.indexOf(saved)!==-1)theme=saved;}catch(e){}document.documentElement.dataset.theme=theme;}catch(e){}})();`;
