import { handleAdminRequest } from "../../../../modules/admin/index";
export const runtime = "nodejs";
export const GET = (req: Request) => handleAdminRequest("csrf", req);
