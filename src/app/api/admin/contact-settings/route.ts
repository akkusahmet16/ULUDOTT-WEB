import { settingsHandler } from "../../../../modules/site-settings/application/http";
export const runtime = "nodejs";
export const GET = settingsHandler("contact");
export const POST = settingsHandler("contact");
