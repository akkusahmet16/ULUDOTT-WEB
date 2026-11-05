import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

export type HardcodedTextViolation = {
  file: string;
  line: number;
  column: number;
  kind:
    | "JsxText"
    | "JsxAttribute"
    | "JsxExpression"
    | "UiVariableOrCollection"
    | "StateSetterCall"
    | "RawLocaleFormatter";
  snippet: string;
};

const USER_FACING_JSX_ATTRIBUTES = new Set([
  "aria-label",
  "aria-roledescription",
  "placeholder",
  "title",
  "alt",
  "label",
  "trigger",
]);

const HAS_LETTER_REGEX = /\p{L}/u;
const HAS_TURKISH_DIACRITIC_REGEX = /[ğĞşŞıİöÖüÜçÇ]/;

function isInsideTranslatorCall(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isCallExpression(current)) {
      const expr = current.expression;
      if (
        ts.isIdentifier(expr) &&
        (expr.text === "t" ||
          expr.text === "tTr" ||
          expr.text === "tEn" ||
          expr.text === "adaptUiErrorMessage")
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function isTechnicalStringLiteral(value: string, node: ts.Node): boolean {
  const trimmed = value.trim();
  if (!trimmed || !HAS_LETTER_REGEX.test(trimmed)) {
    return true;
  }
  // Direktifler
  if (trimmed === "use client" || trimmed === "server-only") {
    return true;
  }
  // Eğer Türkçe karakter içeriyorsa her zaman kullanıcı metni adaydır
  if (HAS_TURKISH_DIACRITIC_REGEX.test(trimmed)) {
    return false;
  }
  // URL, path, CSS seçici, media query, MIME tipi, HTML/DOM teknik belirteçleri
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith(".") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("(") ||
    trimmed.startsWith("file:") ||
    trimmed.startsWith("people-") ||
    trimmed.startsWith("ulujam-") ||
    trimmed.startsWith("place-") ||
    trimmed.startsWith("chapter-") ||
    trimmed.includes("--") ||
    trimmed.includes("vw") ||
    trimmed.includes("px") ||
    trimmed.includes("image/") ||
    trimmed.includes("application/")
  ) {
    return true;
  }

  // Boşluk içermeyen tek kelimelik ASCII teknik anahtar/kod değerleri (ör. "solo", "existing", "new", "POST", "event", "tr", "en")
  if (!/\s/.test(trimmed) && /^[A-Za-z0-9_.:-]+$/.test(trimmed)) {
    // Ancak UI nesnesi (örn. statusMap = { open: "Open" }) içinde Baş Harfi Büyük insan metni ise yakala
    if (
      ts.isPropertyAssignment(node.parent) &&
      node.parent.initializer === node &&
      /^[A-Z][a-z]+$/.test(trimmed)
    ) {
      return false;
    }
    return true;
  }

  return false;
}

export function analyzeTsxSource(
  filePath: string,
  sourceText: string,
  options: { checkHardcodedText: boolean; checkRawFormatters: boolean } = {
    checkHardcodedText: true,
    checkRawFormatters: true,
  },
): HardcodedTextViolation[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const violations: HardcodedTextViolation[] = [];

  function record(
    node: ts.Node,
    kind: HardcodedTextViolation["kind"],
    snippet: string,
  ) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );
    violations.push({
      file: filePath,
      line: line + 1,
      column: character + 1,
      kind,
      snippet: snippet.trim().replace(/\s+/g, " "),
    });
  }

  function visit(node: ts.Node) {
    // 1. Raw locale / Intl formatlayıcı kontrolü (src/i18n/format.ts dışındaki tüm TSX dosyaları)
    if (options.checkRawFormatters) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const methodName = node.expression.name.text;
        if (
          methodName === "toLocaleDateString" ||
          methodName === "toLocaleTimeString" ||
          methodName === "toLocaleString"
        ) {
          record(node, "RawLocaleFormatter", node.getText(sourceFile));
        }
      }
      if (
        ts.isNewExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "Intl" &&
        (node.expression.name.text === "DateTimeFormat" ||
          node.expression.name.text === "NumberFormat" ||
          node.expression.name.text === "RelativeTimeFormat")
      ) {
        record(node, "RawLocaleFormatter", node.getText(sourceFile));
      }
    }

    if (options.checkHardcodedText) {
      // 2. Doğrudan JsxText kontrolü
      if (ts.isJsxText(node)) {
        const text = node.getText(sourceFile).trim();
        if (text && HAS_LETTER_REGEX.test(text)) {
          record(node, "JsxText", text);
        }
      }

      // 3. Kullanıcıya dönük JSX öznitelikleri (aria-label, placeholder, title, alt, vb.)
      if (ts.isJsxAttribute(node)) {
        const attrName = node.name.getText(sourceFile);
        if (USER_FACING_JSX_ATTRIBUTES.has(attrName) && node.initializer) {
          if (ts.isStringLiteral(node.initializer)) {
            const val = node.initializer.text.trim();
            if (val && HAS_LETTER_REGEX.test(val)) {
              record(node.initializer, "JsxAttribute", `${attrName}="${val}"`);
            }
          } else if (
            ts.isJsxExpression(node.initializer) &&
            node.initializer.expression
          ) {
            const expr = node.initializer.expression;
            const checkAttrExpr = (sub: ts.Node) => {
              if (isInsideTranslatorCall(sub)) return;
              if (
                ts.isStringLiteral(sub) ||
                ts.isNoSubstitutionTemplateLiteral(sub)
              ) {
                if (HAS_LETTER_REGEX.test(sub.text)) {
                  record(sub, "JsxAttribute", `${attrName}={${sub.getText(sourceFile)}}`);
                }
              } else if (ts.isTemplateExpression(sub)) {
                const rawSpans = [
                  sub.head.text,
                  ...sub.templateSpans.map((s) => s.literal.text),
                ].join(" ");
                if (HAS_LETTER_REGEX.test(rawSpans)) {
                  record(sub, "JsxAttribute", `${attrName}={${sub.getText(sourceFile)}}`);
                }
              }
              ts.forEachChild(sub, checkAttrExpr);
            };
            checkAttrExpr(expr);
          }
        }
      }

      // 4. JSX çocuk ifadeleri ({cond ? "Metin" : "Diğer"} veya {`Merhaba ${name}`})
      if (
        ts.isJsxExpression(node) &&
        node.parent &&
        (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
        node.expression
      ) {
        const checkJsxChildExpr = (sub: ts.Node) => {
          if (ts.isJsxElement(sub) || ts.isJsxSelfClosingElement(sub) || ts.isJsxFragment(sub)) {
            return;
          }
          if (isInsideTranslatorCall(sub)) return;
          if (
            ts.isStringLiteral(sub) ||
            ts.isNoSubstitutionTemplateLiteral(sub)
          ) {
            if (!isTechnicalStringLiteral(sub.text, sub)) {
              record(sub, "JsxExpression", sub.getText(sourceFile));
            }
          } else if (ts.isTemplateExpression(sub)) {
            const rawSpans = [
              sub.head.text,
              ...sub.templateSpans.map((s) => s.literal.text),
            ].join(" ");
            if (HAS_LETTER_REGEX.test(rawSpans)) {
              record(sub, "JsxExpression", sub.getText(sourceFile));
            }
          }
          ts.forEachChild(sub, checkJsxChildExpr);
        };
        checkJsxChildExpr(node.expression);
      }

      // 5. setMessage(...) / setError(...) çağrılarında sabit metin kontrolü
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const fnName = node.expression.text;
        if ((fnName === "setMessage" || fnName === "setError") && node.arguments.length > 0) {
          const arg = node.arguments[0];
          const checkSetterArg = (sub: ts.Node) => {
            if (isInsideTranslatorCall(sub)) return;
            if (
              (ts.isStringLiteral(sub) ||
                ts.isNoSubstitutionTemplateLiteral(sub)) &&
              sub.text.trim().length > 0 &&
              HAS_LETTER_REGEX.test(sub.text)
            ) {
              record(sub, "StateSetterCall", `${fnName}(${sub.getText(sourceFile)})`);
            }
            ts.forEachChild(sub, checkSetterArg);
          };
          checkSetterArg(arg);
        }
      }

      // 6. Bileşen veya modül içi sabit metin nesneleri/dizileri/değişkenleri (const labels = { ... })
      if (
        (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) &&
        node.initializer &&
        (ts.isStringLiteral(node.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(node.initializer))
      ) {
        if (
          !isInsideTranslatorCall(node.initializer) &&
          !isTechnicalStringLiteral(node.initializer.text, node.initializer)
        ) {
          record(
            node.initializer,
            "UiVariableOrCollection",
            node.getText(sourceFile),
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function collectTsxFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

const ADMIN_EDITOR_EXEMPT_TSX = new Set([
  "src/modules/admin/ui/dashboard.tsx",
  "src/modules/admin/ui/login-form.tsx",
  "src/modules/admin/ui/system-status.tsx",
  "src/modules/cards/ui/check-in-panel.tsx",
  "src/modules/community/people-editor.tsx",
  "src/modules/events/ui/event-editor.tsx",
  "src/modules/events/ui/gallery-editor.tsx",
  "src/modules/forms/ui/form-builder.tsx",
  "src/modules/forms/ui/form-preview.tsx",
  "src/modules/forms/ui/form-settings.tsx",
  "src/modules/forms/ui/submission-detail.tsx",
  "src/modules/forms/ui/submission-list.tsx",
  "src/modules/games/ui/finalist-editor.tsx",
  "src/modules/games/ui/finalist-list.tsx",
  "src/modules/games/ui/game-editor.tsx",
  "src/modules/games/ui/game-list.tsx",
  "src/modules/games/ui/site-game-editor.tsx",
  "src/modules/links/ui/link-editor.tsx",
  "src/modules/matching/ui/seeker-board.tsx",
  "src/modules/media/ui/media-library.tsx",
  "src/modules/media/ui/site-asset-picker.tsx",
  "src/modules/site-settings/ui/archive-editor.tsx",
  "src/modules/site-settings/ui/contact-editor.tsx",
  "src/modules/site-settings/ui/ulujam-editor.tsx",
  "src/modules/teams/ui/approval-detail.tsx",
  "src/modules/teams/ui/approval-queue.tsx",
]);

describe("Faz 3 / İş 3B — AST tabanlı sabit metin ve ham formatlayıcı bekçisi (no-hardcoded-text)", () => {
  it("pozitif (compliant) ve negatif (violating) TSX fixture dosyalarını AST bekçisiyle doğrular", () => {
    const compliantPath = path.join(
      process.cwd(),
      "tests/unit/i18n-guard-fixtures/compliant-component.tsx",
    );
    const violatingPath = path.join(
      process.cwd(),
      "tests/unit/i18n-guard-fixtures/violating-component.tsx",
    );

    const compliantViolations = analyzeTsxSource(
      "tests/unit/i18n-guard-fixtures/compliant-component.tsx",
      fs.readFileSync(compliantPath, "utf8"),
    );
    expect(compliantViolations).toEqual([]);

    const violatingViolations = analyzeTsxSource(
      "tests/unit/i18n-guard-fixtures/violating-component.tsx",
      fs.readFileSync(violatingPath, "utf8"),
    );
    const kinds = new Set(violatingViolations.map((v) => v.kind));
    expect(kinds.has("JsxText")).toBe(true);
    expect(kinds.has("JsxAttribute")).toBe(true);
    expect(kinds.has("JsxExpression")).toBe(true);
    expect(kinds.has("UiVariableOrCollection")).toBe(true);
    expect(kinds.has("StateSetterCall")).toBe(true);
    expect(kinds.has("RawLocaleFormatter")).toBe(true);
  });

  it("tüm genel/özel UI TSX dosyalarında ve AdminWorkspace/AdminNavigation kabuğunda sabit kullanıcı metni bulunmadığını doğrular", () => {
    const allTsx = [
      ...collectTsxFiles(path.join(process.cwd(), "src/app")),
      ...collectTsxFiles(path.join(process.cwd(), "src/components")),
      ...collectTsxFiles(path.join(process.cwd(), "src/modules")),
    ];

    const targetFiles = allTsx.filter((absPath) => {
      const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
      if (rel.startsWith("src/app/admin/")) return false;
      if (ADMIN_EDITOR_EXEMPT_TSX.has(rel)) return false;
      return true;
    });

    expect(targetFiles.length).toBeGreaterThanOrEqual(40);

    const allViolations: HardcodedTextViolation[] = [];
    for (const absPath of targetFiles) {
      const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
      const source = fs.readFileSync(absPath, "utf8");
      allViolations.push(
        ...analyzeTsxSource(rel, source, {
          checkHardcodedText: true,
          checkRawFormatters: true,
        }),
      );
    }

    expect(allViolations).toEqual([]);
  });

  it("admin editörleri dahil hiçbir UI (.tsx) dosyasında src/i18n/format.ts dışında ham toLocale* veya Intl.*Format çağrısı bulunmadığını doğrular", () => {
    const allTsx = collectTsxFiles(path.join(process.cwd(), "src"));
    const rawFormatterViolations: HardcodedTextViolation[] = [];

    for (const absPath of allTsx) {
      const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
      const source = fs.readFileSync(absPath, "utf8");
      rawFormatterViolations.push(
        ...analyzeTsxSource(rel, source, {
          checkHardcodedText: false,
          checkRawFormatters: true,
        }),
      );
    }

    expect(rawFormatterViolations).toEqual([]);
  });
});
