import { handleSubmissions } from "../../../../../modules/forms/application/submission-http";
type Context = { params: Promise<{ submissionId: string }> };
export const GET = async (req: Request, { params }: Context) =>
  handleSubmissions(req, (await params).submissionId);
export const POST = async (req: Request, { params }: Context) =>
  handleSubmissions(req, (await params).submissionId);
