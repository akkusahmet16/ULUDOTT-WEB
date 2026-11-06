import { createReadStream, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".json": "application/json",
};

interface ResolvedFile {
  filePath: string;
  size: number;
}

function resolveVendorFile(segments: string[]): ResolvedFile | null {
  for (const seg of segments) {
    if (seg.includes("..") || seg.includes("/") || seg.includes("\\") || seg.includes("\0")) {
      return null;
    }
  }

  const relativePath = segments.map((s) => decodeURIComponent(s)).join("/");
  const cwd = process.cwd();
  const candidatePaths = [
    join(cwd, "public", "vendor", relativePath),
    join(cwd, "vendor", relativePath),
    join(cwd, "..", "public", "vendor", relativePath),
    join(cwd, "..", "vendor", relativePath),
    join(cwd, "..", "..", "public", "vendor", relativePath),
    join(cwd, "..", "..", "vendor", relativePath),
    join(cwd, ".next", "standalone", "public", "vendor", relativePath),
    join(cwd, ".next", "standalone", "vendor", relativePath),
  ];

  for (const cand of candidatePaths) {
    if (existsSync(cand)) {
      try {
        const stat = statSync(cand);
        if (stat.isFile()) {
          return { filePath: cand, size: stat.size };
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return new Response("Not found", { status: 404 });
    }

    const resolved = resolveVendorFile(segments);
    if (!resolved) {
      return new Response("File not found", { status: 404 });
    }

    const ext = extname(resolved.filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const nodeStream = createReadStream(resolved.filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(resolved.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
