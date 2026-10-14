import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

export function sourceFiles(directory = "src"): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx|css)$/.test(path) ? [path] : [];
  });
}

const namedColors = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(" "));
const literalColor = /#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b|\b(?:rgba?|hsla?|oklch|lab)\s*\(/i;
const colorProperties = /^(?:color|background.*|border.*Color|outline.*Color|boxShadow|textShadow|fill|stroke|caretColor|accentColor)$/;

export function colorViolations(path: string, source = readFileSync(path, "utf8")): string[] {
  const errors: string[] = [];
  if (path.endsWith(".css")) {
    const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const declaration of css.matchAll(/(?:^|(?<=[;{]))\s*([\w-]+)\s*:\s*([^;{}]+)[;}]/g)) {
      const value = declaration[2].replace(/var\(--[\w-]+\)/g, "").replace(/url\([^)]*\)/g, "");
      if (literalColor.test(value) || value.match(/[a-z]+/gi)?.some(word => namedColors.has(word.toLowerCase()))) errors.push(`${path}: ${declaration[1]}: ${declaration[2]}`);
    }
    return errors;
  }
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node)) {
      const isAnchor = ts.isJsxAttribute(node.parent) && node.parent.name.getText(file) === "href" && node.text.startsWith("#");
      if (!isAnchor && literalColor.test(node.text)) errors.push(`${path}: ${node.text}`);
    }
    if (ts.isJsxAttribute(node) && ["fill", "stroke"].includes(node.name.getText(file)) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const value = node.initializer.text;
      if (!["currentColor", "inherit", "transparent", "none"].includes(value) && !value.startsWith("var(--")) errors.push(`${path}: SVG ${value}`);
    }
    if (ts.isJsxAttribute(node) && node.name.getText(file) === "style" && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isObjectLiteralExpression(node.initializer.expression)) {
      for (const property of node.initializer.expression.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name.getText(file).replace(/["']/g, "");
        if (name.startsWith("--") || !colorProperties.test(name)) continue;
        if (!ts.isStringLiteralLike(property.initializer) || !/^var\(--[\w-]+\)$/.test(property.initializer.text)) errors.push(`${path}: inline ${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return errors;
}
