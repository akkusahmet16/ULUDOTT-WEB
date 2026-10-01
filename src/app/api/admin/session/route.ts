import { handleAdminRequest } from "../../../../modules/admin/index";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return handleAdminRequest("session", request);
}
