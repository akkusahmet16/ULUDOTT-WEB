import { getPublicVariant } from "../../../modules/media/index";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await params;
    const result = await getPublicVariant(variantId);
    if (!result)
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    return new Response(Uint8Array.from(result.data), {
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "public, max-age=60, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
