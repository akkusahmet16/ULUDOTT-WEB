import { handleGoogleWallet } from "../../../../../modules/wallet/application/google-http";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ cardToken: string }> },
) {
  return handleGoogleWallet(request, (await ctx.params).cardToken);
}
