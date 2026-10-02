import { createLinkQr } from "../../../../../modules/links/application/link-qr";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const data = await createLinkQr((await params).id);
    return data
      ? new Response(Uint8Array.from(data), {
          headers: { ...headers, "Content-Type": "image/png" },
        })
      : new Response(null, { status: 404, headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
