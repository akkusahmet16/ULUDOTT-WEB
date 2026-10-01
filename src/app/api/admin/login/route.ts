import { handleAdminRequest } from "../../../../modules/admin/index";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handleAdminRequest("login", request);
}
