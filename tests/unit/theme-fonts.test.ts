import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";

it("üç gerçek next/font/google tanımı merkezidir; latin-ext, swap ve classic için preload:false zorunlu", () => {
  const file = ts.createSourceFile("fonts.ts", readFileSync("src/config/fonts.ts", "utf8"), ts.ScriptTarget.Latest, true);
  const imports: string[] = [];
  const fonts = new Map<string, Map<string, string>>();
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const options = node.arguments[0];
      if (["Press_Start_2P", "Space_Grotesk", "VT323"].includes(node.expression.text) && options && ts.isObjectLiteralExpression(options)) {
        const fields = new Map<string, string>();
        for (const property of options.properties) {
          if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) fields.set(property.name.text, property.initializer.getText(file));
        }
        fonts.set(node.expression.text, fields);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  expect(imports).toContain("next/font/google");
  expect([...fonts.keys()].sort()).toEqual(["Press_Start_2P", "Space_Grotesk", "VT323"].sort());
  for (const options of fonts.values()) {
    expect(options.get("subsets")).toBe('["latin", "latin-ext"]');
    expect(options.get("display")).toBe('"swap"');
    expect(options.get("preload")).toBe("false");
    expect(options.get("variable")).toMatch(/^"--font-(?:display|body|label)-face"$/);
  }
});
