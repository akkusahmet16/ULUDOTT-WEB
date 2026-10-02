import { handleSubmissions } from "../../../../../modules/forms/application/submission-http";
export const POST = (req: Request) => handleSubmissions(req, undefined, true);
