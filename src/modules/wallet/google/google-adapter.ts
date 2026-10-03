import "server-only";
import { z } from "zod";
import type { GoogleConfig } from "../../../lib/config/wallet.ts";
import { GoogleClient, GoogleWalletError, signJwt } from "./google-client.ts";
import {
  buildGooglePass,
  googleClassId,
  googleObjectId,
  type GoogleCard,
} from "./google-pass.ts";
export class GoogleWalletAdapter {
  private readonly config: GoogleConfig;
  private readonly client: GoogleClient;
  constructor(config: GoogleConfig, client = new GoogleClient(config)) {
    this.config = config;
    this.client = client;
  }
  async ensureClass(eventId: string) {
    z.uuid().parse(eventId);
    const id = googleClassId(this.config.issuerId, eventId);
    let r = await this.client.request(
      "genericClass",
      "POST",
      undefined,
      { id },
      true,
    );
    if (r.conflict) r = await this.client.request("genericClass", "GET", id);
    if (r.data.id !== id) throw new GoogleWalletError("GOOGLE_PROTOCOL");
    return id;
  }
  async upsertPass(card: GoogleCard, revision: number) {
    if (revision !== card.revision) throw Error("STALE_REVISION");
    if (card.status !== "active") throw Error("CARD_INACTIVE");
    z.uuid().parse(card.id);
    z.uuid().parse(card.eventId);
    await this.ensureClass(card.eventId);
    const body = buildGooglePass(card, this.config.issuerId),
      id = String(body.id);
    let r = await this.client.request(
      "genericObject",
      "POST",
      undefined,
      body,
      true,
    );
    if (r.conflict)
      r = await this.client.request("genericObject", "PATCH", id, body);
    if (
      r.data.id !== id ||
      (r.data.state !== "ACTIVE" && r.data.state !== "active")
    )
      throw new GoogleWalletError("GOOGLE_PROTOCOL");
    return id;
  }
  createSaveLink(card: GoogleCard, origin: string) {
    const url = new URL(origin);
    if (
      url.origin !== this.config.appOrigin ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw Error("SAVE_ORIGIN");
    if (card.status !== "active") throw Error("CARD_INACTIVE");
    // Reference an existing object only: old save links cannot restore historical ACTIVE data.
    const jwt = signJwt(
      {
        iss: this.config.clientEmail,
        aud: "google",
        typ: "savetowallet",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 600,
        origins: [url.hostname],
        payload: {
          genericObjects: [
            { id: googleObjectId(this.config.issuerId, card.id) },
          ],
        },
      },
      this.config.privateKey,
    );
    return "https://pay.google.com/gp/v/save/" + jwt;
  }
  async deactivatePass(objectId: string) {
    if (!objectId.startsWith(this.config.issuerId + "."))
      throw new GoogleWalletError("GOOGLE_IDENTITY_CHANGED");
    const r = await this.client.request("genericObject", "PATCH", objectId, {
      state: "INACTIVE",
    });
    if (
      r.data.id !== objectId ||
      (r.data.state !== "INACTIVE" && r.data.state !== "inactive")
    )
      throw new GoogleWalletError("GOOGLE_PROTOCOL");
  }
}
