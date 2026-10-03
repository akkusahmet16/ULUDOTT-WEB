import "server-only";
import { sql } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import {
  googleReadiness,
  loadGoogleConfig,
} from "../../../lib/config/wallet.ts";
import { decryptReplay } from "../../forms/infrastructure/submission-repository.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { cardToken } from "../../cards/application/card-service.ts";
import type { readCard } from "../../cards/infrastructure/card-repository.ts";
import {
  lockWalletCard,
  readPasses,
} from "../infrastructure/wallet-repository.ts";
import { GoogleWalletAdapter } from "../google/google-adapter.ts";
import { GoogleWalletError } from "../google/google-client.ts";
import { googleObjectId, type GoogleCard } from "../google/google-pass.ts";
import { requestWalletPass } from "./wallet-service.ts";
import { z } from "zod";
type Card = NonNullable<Awaited<ReturnType<typeof readCard>>>;
export async function googleCardProjection(
  tx: DbTx,
  card: Card,
): Promise<GoogleCard> {
  if (!card.encrypted) throw Error("CHECKIN_UNAVAILABLE");
  const checkin = z
    .object({ token: cardToken })
    .parse(decryptReplay(card.encrypted, "check-in:" + card.id));
  const [result] = await tx.execute(
    sql`select min(aw.rank)::int rank,bool_or(f.id is not null) finalist from memberships m join games g on g.team_id=m.team_id and g.event_id=${card.eventId}::uuid and g.published_at is not null left join awards aw on aw.game_id=g.id left join finalists f on f.game_id=g.id where m.application_id=${card.applicationId}::uuid and m.left_at is null`,
  );
  return {
    id: card.id,
    eventId: card.eventId,
    revision: card.revision,
    name: card.name,
    eventTitle: card.eventTitle,
    teamName: card.teamName,
    status: card.status,
    checkinToken: checkin.token,
    rank: result?.rank ? Number(result.rank) : null,
    finalist: result?.finalist === true,
  };
}
export async function syncGooglePass(
  tx: DbTx,
  card: Card,
): Promise<string | null> {
  const pass = (await readPasses(card.id, tx)).find(
    (p) => p.provider === "google",
  );
  if (!pass || googleReadiness() === "unconfigured") return null;
  // Known applied revision/state avoids issuing a historical update on duplicate delivery.
  if (
    card.status === "active" &&
    pass.status === "ready" &&
    pass.providerState === "active" &&
    pass.syncedRevision === card.revision
  )
    return null;
  if (
    card.status !== "active" &&
    pass.providerState === "revoked" &&
    pass.syncedRevision === card.revision
  )
    return null;
  try {
    const config = loadGoogleConfig(),
      adapter = new GoogleWalletAdapter(config),
      id = googleObjectId(config.issuerId, card.id);
    if (pass.objectId !== id) {
      if (pass.providerState !== "unknown" || pass.syncedRevision !== 0)
        throw new GoogleWalletError("GOOGLE_IDENTITY_CHANGED");
      await tx.execute(
        sql`update wallet_passes set object_id=${id} where id=${pass.id}::uuid`,
      );
    }
    if (card.status === "active")
      await adapter.upsertPass(
        await googleCardProjection(tx, card),
        card.revision,
      );
    else await adapter.deactivatePass(id);
    await tx.execute(
      sql`update wallet_passes set status=${card.status === "active" ? "ready" : "revoked"},provider_state=${card.status === "active" ? "active" : "revoked"},revision=${card.revision},synced_revision=${card.revision},last_error_code=null,updated_at=clock_timestamp() where id=${pass.id}::uuid`,
    );
    return null;
  } catch (error) {
    const code =
      error instanceof GoogleWalletError
        ? error.code
        : error instanceof Error &&
            error.message === "GOOGLE_CONFIG_UNAVAILABLE"
          ? "GOOGLE_CONFIG_UNAVAILABLE"
          : "GOOGLE_UNAVAILABLE";
    await tx.execute(
      sql`update wallet_passes set status=${card.status === "active" ? "failed" : "revoked"},last_error_code=${code},updated_at=clock_timestamp() where id=${pass.id}::uuid`,
    );
    return code;
  }
}
export async function requestGooglePass(token: string) {
  await requestWalletPass(token, "google"); // Stores the approved request atomically; provider failure cannot erase it.
  const result = await withTransaction(async (tx) => {
    const card = await lockWalletCard(
      tx,
      sql`c.token_hash=${tokenHash(token)}`,
    );
    if (!card) throw new SubmissionError(404, "Kart bulunamadı");
    if (card.status !== "active" || card.expired)
      throw new SubmissionError(
        403,
        "Wallet için onaylı aktif katılım gerekli",
      );
    if (googleReadiness() === "unconfigured")
      return { error: "GOOGLE_CONFIG_UNAVAILABLE" };
    const error = await syncGooglePass(tx, card);
    if (error) return { error };
    const adapter = new GoogleWalletAdapter(loadGoogleConfig());
    return {
      url: adapter.createSaveLink(
        await googleCardProjection(tx, card),
        loadGoogleConfig().appOrigin,
      ),
      readiness: googleReadiness(),
    };
  });
  if ("error" in result)
    throw new SubmissionError(
      503,
      "Google Wallet şu anda hazır değil veya sağlayıcı isteği tamamlanamadı",
    );
  return result;
}
