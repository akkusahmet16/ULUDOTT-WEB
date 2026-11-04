import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcssSafe = require("next/dist/compiled/postcss-safe-parser");

const CSS_FILES = [
  "src/styles/tokens.css",
  "src/styles/cinematic.css",
  "src/styles/home.module.css",
  "src/app/(public)/iletisim/contact.module.css",
  "src/modules/cards/ui/web-card.module.css",
  "src/modules/admin/ui/content-workspace.module.css",
  "src/modules/admin/ui/dashboard.module.css",
  "src/modules/admin/ui/admin-workspace.module.css",
  "src/modules/teams/ui/team-page.module.css",
  "src/modules/events/ui/event-editor.module.css",
  "src/modules/events/ui/past-events-carousel.module.css",
];

const SOURCE_COMMIT = "1715682f396d1698871c6615766623cacb0d8405";

export interface GoldenDeclaration {
  sourceOrder: number;
  file: string;
  line: number;
  selectorChain: string;
  prop: string;
  rawValue: string;
  resolvedValue: string;
}

export interface GoldenDeclarationsPayload {
  version: 1;
  sourceCommit: string;
  generatedAt: string;
  note: string;
  totalDeclarations: number;
  files: string[];
  declarations: GoldenDeclaration[];
}

export const KNOWN_TOKENS: Record<string, string> = {
  "--ink": "#0c0d1b",
  "--panel": "#18182c",
  "--cream": "#fff9cb",
  "--muted": "#cac4d7",
  "--purple": "#edb2e4",
  "--lime": "#f6b6cb",
  "--coral": "#ffbd9e",
  "--line": "#51495f",
  "--radius": "4px",
  "--space": "clamp(22px, 6vw, 100px)",
  "--font": "var(--font-body), Arial, sans-serif",
  "--heading": "var(--font-display), Impact, sans-serif",
  "--mono": "var(--font-body), sans-serif",
  "--ease": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--motion": "600ms",
  "--admin-bg": "#0d101b",
  "--admin-panel": "#171c2b",
  "--admin-border": "#ffffff1c",
  "--admin-muted": "#aab3c8",
};

export function resolveValue(value: string, tokenMap: Record<string, string> = KNOWN_TOKENS): string {
  let prev = "";
  let curr = value;
  let iterations = 0;
  while (prev !== curr && iterations < 10) {
    prev = curr;
    iterations++;
    for (const [token, replacement] of Object.entries(tokenMap)) {
      const regex = new RegExp(`var\\(${token}\\)`, "g");
      curr = curr.replace(regex, replacement);
    }
  }
  return curr;
}

interface PostcssNode {
  type: string;
  prop?: string;
  value?: string;
  important?: boolean;
  name?: string;
  params?: string;
  selector?: string;
  parent?: PostcssNode;
  source?: { start?: { line?: number } };
}

export function buildGoldenDeclarations(): GoldenDeclarationsPayload {
  const declarations: GoldenDeclaration[] = [];
  let sourceOrder = 0;

  for (const relPath of CSS_FILES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`CSS file not found: ${relPath}`);
    }

    const cssContent = fs.readFileSync(fullPath, "utf8");
    const root = postcssSafe(cssContent);

    root.walkDecls((decl: PostcssNode) => {
      sourceOrder++;
      const prop = (decl.prop ?? "").toLowerCase();
      const rawValue = (decl.value ?? "") + (decl.important ? " !important" : "");
      const resolvedValue = resolveValue(rawValue);

      const parts: string[] = [];
      let curr = decl.parent;
      while (curr && curr.type !== "root") {
        if (curr.type === "rule" && curr.selector) {
          parts.unshift(curr.selector.replace(/\s+/g, " ").trim());
        } else if (curr.type === "atrule" && curr.name) {
          parts.unshift(`@${curr.name} ${curr.params ?? ""}`.replace(/\s+/g, " ").trim());
        }
        curr = curr.parent;
      }
      const selectorChain = parts.join(" > ");
      const line = decl.source?.start?.line ?? 0;

      declarations.push({
        sourceOrder,
        file: relPath,
        line,
        selectorChain,
        prop,
        rawValue,
        resolvedValue,
      });
    });
  }

  return {
    version: 1,
    sourceCommit: SOURCE_COMMIT,
    generatedAt: new Date().toISOString(),
    note: `DO NOT REGENERATE WITHOUT EXPLICIT PERMISSION. Generated from source commit ${SOURCE_COMMIT}.`,
    totalDeclarations: declarations.length,
    files: [...CSS_FILES],
    declarations,
  };
}

function main() {
  const payload = buildGoldenDeclarations();
  const outputPath = path.resolve(process.cwd(), "tests/fixtures/golden-declarations.json");
  const localCopyPath = path.resolve(process.cwd(), ".local/phase-1/golden-declarations.json");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(localCopyPath), { recursive: true });

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(outputPath, jsonStr, "utf8");
  fs.writeFileSync(localCopyPath, jsonStr, "utf8");

  console.log(`Successfully built golden declarations:`);
  console.log(`- Total declarations: ${payload.totalDeclarations}`);
  console.log(`- Files processed: ${payload.files.length}`);
  console.log(`- Written to: ${outputPath}`);
  console.log(`- Mirror written to: ${localCopyPath}`);
}

if (process.argv[1] && process.argv[1].endsWith("build-golden-declarations.ts")) {
  main();
}
