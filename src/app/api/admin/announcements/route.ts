import { handler } from "../../../../modules/publication/http";
export const runtime = "nodejs";
export const GET = handler("announcement");
export const POST = GET;
