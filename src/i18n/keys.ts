import { trDictionary, type PublicDictionary } from "./dictionaries/tr.ts";

export type LeafPaths<
  T,
  Prefix extends string = "",
> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${K}`
        : T[K] extends Readonly<Record<string, unknown>>
          ? LeafPaths<T[K], `${Prefix}${K}.`>
          : never;
    }[keyof T & string];

/**
 * DictionaryKey yalnızca public sözlüğün yaprak (leaf) yollarını temsil eder.
 * Ara ad alanları (ör. "nav" veya "meta.home") kabul edilmez.
 */
export type DictionaryKey = LeafPaths<PublicDictionary>;

export type DictionaryNamespace = keyof PublicDictionary & string;

export function extractLeafKeys(
  node: Readonly<Record<string, unknown>>,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.push(path);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(
        ...extractLeafKeys(value as Readonly<Record<string, unknown>>, path),
      );
    }
  }
  return keys;
}

export const PUBLIC_DICTIONARY_KEYS: readonly DictionaryKey[] = Object.freeze(
  extractLeafKeys(trDictionary) as DictionaryKey[],
);

const PUBLIC_DICTIONARY_KEY_SET: ReadonlySet<string> = new Set(
  PUBLIC_DICTIONARY_KEYS,
);

export function isDictionaryKey(value: unknown): value is DictionaryKey {
  return typeof value === "string" && PUBLIC_DICTIONARY_KEY_SET.has(value);
}

const PLACEHOLDER_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

export function extractPlaceholders(template: string): string[] {
  const seen = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    if (match[1]) {
      seen.add(match[1]);
    }
  }
  return [...seen];
}
