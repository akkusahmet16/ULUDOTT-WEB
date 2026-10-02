import { gameRequest } from "../../../../modules/games/application/game-http";
export const runtime = "nodejs";
export const GET = (req: Request) => gameRequest(req);
export const POST = (req: Request) => gameRequest(req);
