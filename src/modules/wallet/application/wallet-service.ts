import "server-only";
import { sql } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { z } from "zod";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import {
  cardToken,
  ownCardRecord,
} from "../../cards/application/card-service.ts";
import { readCard } from "../../cards/infrastructure/card-repository.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import {
  lockWalletCard,
  readPasses,
} from "../infrastructure/wallet-repository.ts";
import {
  googleReadiness,
  providerObjectId,
} from "../../../lib/config/wallet.ts";
import { passState, type Provider } from "../domain/pass-state.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
export const providerSchema = z.enum(["google", "apple"]);
export async function assertWalletEligible(
  participantId: string,
  provider: Provider,
) {
  z.uuid().parse(participantId);
  providerSchema.parse(provider);
  const card = await readCard(sql`c.application_id=${participantId}::uuid`);
  if (!card || card.status !== "active" || card.expired)
    throw new SubmissionError(403, "Wallet için onaylı aktif katılım gerekli");
  return { cardId: card.id, revision: card.revision };
}
export async function getWalletStatus(token: string) {
  const card = await ownCardRecord(token);
  const passes = await readPasses(card.id);
  return {
    eligibility: card.status,
    revision: card.revision,
    providers: {
      google: {
        status: passState(
          card.status,
          passes.find((p) => p.provider === "google"),
          card.revision,
        ),
        readiness: googleReadiness(),
      },
      apple: {
        status: passState(
          card.status,
          passes.find((p) => p.provider === "apple"),
          card.revision,
        ),
        readiness: "unconfigured" as const,
      },
    },
  };
}
export async function requestWalletPass(token: string, provider: Provider) {
  providerSchema.parse(provider);
  if (!cardToken.safeParse(token).success)
    throw new SubmissionError(404, "Kart bulunamadı");
  return withTransaction(async (tx) => {
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
    const objectId = providerObjectId(provider, card.id);
    await tx.execute(
      sql`insert into wallet_passes(card_id,provider,object_id,revision) values(${card.id}::uuid,${provider},${objectId},${card.revision}) on conflict(card_id,provider) do nothing`,
    );
    await syncCardPasses(tx, card);
    await enqueue(tx, "wallet.requested", card.id, card.revision, {
      cardId: card.id,
      applicationId: card.applicationId,
    });
    const pass = (await readPasses(card.id, tx)).find(
      (p) => p.provider === provider,
    )!;
    return {
      status: passState(card.status, pass, card.revision),
      readiness:
        provider === "google" ? googleReadiness() : ("unconfigured" as const),
    };
  });
}
export async function syncCardPasses(
  tx: DbTx,
  card: NonNullable<Awaited<ReturnType<typeof readCard>>>,
) {
  await tx.execute(
    sql`update wallet_passes set revision=${card.revision},status=case when ${card.status}!='active' then 'revoked' when revision!=${card.revision} or status='revoked' then 'pending' else status end,updated_at=clock_timestamp() where card_id=${card.id}::uuid and revision<=${card.revision}`,
  );
}
export async function syncPassRevision(
  participantId: string,
  revision: number,
) {
  z.uuid().parse(participantId);
  z.int().positive().parse(revision);
  return withTransaction(async (tx) => {
    const card = await lockWalletCard(
      tx,
      sql`c.application_id=${participantId}::uuid`,
    );
    if (card) await syncCardPasses(tx, card); // Always uses newest projection, including replayed work.
  });
}

export async function reconcileWalletBatch(cursor?: string) {
  if (cursor) z.uuid().parse(cursor);
  const rows = await getDatabase().execute(
    sql`select distinct c.id,c.application_id from cards c join wallet_passes p on p.card_id=c.id where ${cursor ? sql`c.id>${cursor}::uuid` : sql`true`} order by c.id limit 20`,
  );
  for (const r of rows) await syncPassRevision(String(r.application_id), 1);
  return rows.length === 20 ? String(rows.at(-1)!.id) : undefined;
}
