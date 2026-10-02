import { getPublishedLink } from "../../../modules/links/application/link-service";
import { loadServerConfig } from "../../../lib/config/server";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const item = await getPublishedLink((await params).id);
    if (!item) return new Response(null, { status: 404, headers });
    return new Response(null, {
      status: 307,
      headers: {
        ...headers,
        Location: new URL(item.url, loadServerConfig().appUrl).toString(),
      },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
