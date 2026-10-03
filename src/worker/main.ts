import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { closeDatabase } from "../lib/database/client.ts";
import { reconcileWalletBatch } from "../modules/wallet/index.ts";
import { processBatch } from "./handlers.ts";
const workerId = "worker-" + randomUUID();
let stopping = false;
let sweepCursor: string | undefined;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
try {
  do {
    await processBatch(workerId, 5);
    sweepCursor = await reconcileWalletBatch(sweepCursor);
    if (process.argv.includes("--once")) break;
    if (!stopping) await setTimeout(1000);
  } while (!stopping);
} catch {
  console.error("WORKER_UNAVAILABLE");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
