import { settingsHandler } from "../../../../modules/site-settings/application/http";
export const runtime = "nodejs";
export const GET = settingsHandler("places");
export const POST = settingsHandler("places");
