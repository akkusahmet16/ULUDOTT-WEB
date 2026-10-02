import { gameRequest } from "../../../../../modules/games/application/game-http";
export const runtime = "nodejs";
async function handle(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  return gameRequest(req, (await params).gameId);
}
export const GET = handle;
export const POST = handle;
