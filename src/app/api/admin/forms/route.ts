import { handleForms } from "../../../../modules/forms/application/admin-http";
export const runtime = "nodejs";
export const GET = (req: Request) => handleForms(req);
export const POST = (req: Request) => handleForms(req);
