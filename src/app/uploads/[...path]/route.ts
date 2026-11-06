import { createReadStream, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".json": "application/json",
  ".txt": "text/plain",
};

interface ResolvedFile {
  filePath: string;
  size: number;
}

function resolveUploadFile(segments: string[]): ResolvedFile | null {
  for (const seg of segments) {
    if (seg.includes("..") || seg.includes("/") || seg.includes("\\") || seg.includes("\0")) {
      return null;
    }
  }

  const relativePath = segments.join("/");
  const candidatePaths = [
    join(process.cwd(), "public", "uploads", relativePath),
    join(process.cwd(), "uploads", relativePath),
    join(process.cwd(), "..", "public", "uploads", relativePath),
    join(process.cwd(), "..", "uploads", relativePath),
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

    const resolved = resolveUploadFile(segments);
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
        "Cache-Control": "public, max-age=86400, must-revalidate",
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return new Response(null, { status: 404 });
    }

    const resolved = resolveUploadFile(segments);
    if (!resolved) {
      return new Response(null, { status: 404 });
    }

    const ext = extname(resolved.filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(resolved.size),
        "Cache-Control": "public, max-age=86400, must-revalidate",
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
