import { settingsHandler } from "../../../../modules/site-settings/application/http";
export const runtime = "nodejs";
export const GET = settingsHandler("ulujam");
export const POST = settingsHandler("ulujam");
