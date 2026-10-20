import { settingsHandler } from "../../../../modules/site-settings/application/http";
export const runtime = "nodejs";
export const GET = settingsHandler("archives");
export const POST = settingsHandler("archives");
