import { createReadStream, statSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";
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

  const relativePath = segments.map((s) => decodeURIComponent(s)).join("/");
  const cwd = process.cwd();
  const candidatePaths = [
    join(cwd, "public", "uploads", relativePath),
    join(cwd, "uploads", relativePath),
    join(cwd, "..", "public", "uploads", relativePath),
    join(cwd, "..", "uploads", relativePath),
    join(cwd, "..", "..", "public", "uploads", relativePath),
    join(cwd, "..", "..", "uploads", relativePath),
    join(cwd, ".next", "standalone", "public", "uploads", relativePath),
    join(cwd, ".next", "standalone", "uploads", relativePath),
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
  request: Request,
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
    const totalSize = resolved.size;

    const url = new URL(request.url);
    const isDownload = url.searchParams.has("download");
    const fileBase = basename(resolved.filePath);
    const contentDisposition = isDownload
      ? `attachment; filename="${encodeURIComponent(fileBase)}"`
      : "inline";

    const rangeHeader = request.headers.get("range");
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace("bytes=", "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && start < totalSize && end < totalSize && start <= end) {
        const chunkSize = end - start + 1;
        const nodeStream = createReadStream(resolved.filePath, { start, end });
        const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

        return new Response(webStream, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Content-Length": String(chunkSize),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400, must-revalidate",
            "Content-Disposition": contentDisposition,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }

    const nodeStream = createReadStream(resolved.filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Cache-Control": "public, max-age=86400, must-revalidate",
        "Accept-Ranges": "bytes",
        "Content-Disposition": contentDisposition,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function HEAD(
  request: Request,
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

    const url = new URL(request.url);
    const isDownload = url.searchParams.has("download");
    const fileBase = basename(resolved.filePath);
    const contentDisposition = isDownload
      ? `attachment; filename="${encodeURIComponent(fileBase)}"`
      : "inline";

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(resolved.size),
        "Cache-Control": "public, max-age=86400, must-revalidate",
        "Accept-Ranges": "bytes",
        "Content-Disposition": contentDisposition,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
