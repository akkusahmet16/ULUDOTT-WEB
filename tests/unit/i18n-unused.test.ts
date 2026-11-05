import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { adminTrDictionary } from "../../src/i18n/dictionaries/admin-tr.ts";
import { KNOWN_UI_ERROR_KEYS } from "../../src/i18n/error-adapter.ts";
import {
  extractLeafKeys,
  PUBLIC_DICTIONARY_KEYS,
  type DictionaryKey,
} from "../../src/i18n/keys.ts";

function collectSourceFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

const EXCLUDED_DICTIONARY_FILES = new Set([
  "src/i18n/dictionaries/tr.ts",
  "src/i18n/dictionaries/en.ts",
  "src/i18n/dictionaries/client-tr.ts",
  "src/i18n/dictionaries/admin-tr.ts",
  "src/i18n/keys.ts",
]);

/**
 * Dinamik nesne erişimiyle tüketilen sınırlı anahtar grupları:
 * - `forms.fieldTypes.*`: `src/modules/forms/ui/form-fields.tsx` içinde `typeLabels = clientTrSlice.forms.fieldTypes` olarak tüketilir.
 * - `errors.*`: `src/i18n/error-adapter.ts` içindeki `KNOWN_UI_ERROR_KEYS` tablosu üzerinden tüketilir.
 */
const DYNAMICALLY_CONSUMED_KEYS = new Set<DictionaryKey>([
  "common.explore",
  "common.pageCount",
  "forms.typeShortText",
  "forms.typeLongText",
  "forms.typeEmail",
  "forms.typePhone",
  "forms.typeNumber",
  "forms.typeDate",
  "forms.typeFile",
  "forms.typeSingleChoice",
  "forms.typeMultipleChoice",
  "forms.typeDropdown",
  "forms.typeCheckbox",
  "forms.typeRadio",
  "forms.typeRating",
  "forms.typeInfo",
  "forms.typeSection",
  "forms.typeConsent",
  ...Object.values(KNOWN_UI_ERROR_KEYS),
]);

describe("Faz 3 / İş 3B — Kullanılmayan (ölü) sözlük anahtarı bekçisi (i18n-unused)", () => {
  it("PUBLIC_DICTIONARY_KEYS içindeki her yaprak anahtarın src/ kod tabanında gerçekten kullanıldığını doğrular", () => {
    const srcFiles = collectSourceFiles(path.join(process.cwd(), "src")).filter(
      (absPath) => {
        const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
        return !EXCLUDED_DICTIONARY_FILES.has(rel);
      },
    );

    const combinedSource = srcFiles
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");

    const unusedKeys: string[] = [];
    for (const key of PUBLIC_DICTIONARY_KEYS) {
      const staticallyReferenced =
        combinedSource.includes(`"${key}"`) ||
        combinedSource.includes(`'${key}'`);
      const dynamicallyReferenced = DYNAMICALLY_CONSUMED_KEYS.has(key);

      if (!staticallyReferenced && !dynamicallyReferenced) {
        unusedKeys.push(key);
      }
    }

    expect(unusedKeys).toEqual([]);
  });

  it("adminTrDictionary içindeki workspace ve navigation anahtarlarının AdminWorkspace ve AdminNavigation bileşenlerinde kullanıldığını doğrular", () => {
    const workspaceSource = fs.readFileSync(
      path.join(process.cwd(), "src/modules/admin/ui/admin-workspace.tsx"),
      "utf8",
    );
    const navSource = fs.readFileSync(
      path.join(process.cwd(), "src/modules/admin/ui/admin-navigation.tsx"),
      "utf8",
    );

    const adminLeafKeys = extractLeafKeys(adminTrDictionary);
    expect(adminLeafKeys.length).toBeGreaterThanOrEqual(20);

    for (const key of Object.keys(adminTrDictionary.workspace)) {
      if (
        ["title", "eyebrow", "signOut", "dashboard"].includes(key)
      ) {
        continue;
      }
      expect(
        workspaceSource.includes(`w.${key}`),
        `Expected AdminWorkspace to reference w.${key}`,
      ).toBe(true);
    }

    for (const key of Object.keys(adminTrDictionary.navigation)) {
      expect(
        navSource.includes(`nav.${key}`),
        `Expected AdminNavigation to reference nav.${key}`,
      ).toBe(true);
    }
  });
});
