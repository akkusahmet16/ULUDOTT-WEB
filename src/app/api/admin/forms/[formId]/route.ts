import { handleForms } from "../../../../../modules/forms/application/admin-http";
export const runtime = "nodejs";
async function handle(
  req: Request,
  context: { params: Promise<{ formId: string }> },
) {
  return handleForms(req, (await context.params).formId);
}
export const GET = handle;
export const POST = handle;
