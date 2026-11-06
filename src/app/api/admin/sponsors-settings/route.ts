import { settingsHandler } from "../../../../modules/site-settings/application/http";
export const runtime = "nodejs";
export const GET = settingsHandler("sponsors");
export const POST = settingsHandler("sponsors");
