import { handleSubmissions } from "../../../../modules/forms/application/submission-http";
export const GET = (req: Request) => handleSubmissions(req);
export const POST = (req: Request) => handleSubmissions(req);
