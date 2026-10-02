import { teamRequest } from "../../../../modules/teams/application/team-http";
export const runtime = "nodejs";
export const POST = (req: Request) => teamRequest(req, "logout");
