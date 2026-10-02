import { publicSubmit } from "../../../../../modules/forms/application/public-http";
export const runtime = "nodejs";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ formSlug: string }> },
) {
  return publicSubmit(req, (await ctx.params).formSlug);
}
