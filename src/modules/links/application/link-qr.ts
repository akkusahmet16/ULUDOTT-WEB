import "server-only";
import QRCode from "qrcode";
import { getPublishedLink } from "./link-service.ts";
import { loadServerConfig } from "../../../lib/config/server.ts";
export async function createLinkQr(id: string) {
  if (!(await getPublishedLink(id))) return null;
  return QRCode.toBuffer(
    new URL(`/l/${id}`, loadServerConfig().appUrl).toString(),
    { type: "png", width: 256, margin: 4, errorCorrectionLevel: "M" },
  );
}
