import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { closeDatabase } from "../lib/database/client.ts";
import { processBatch } from "./handlers.ts";
const workerId = "worker-" + randomUUID();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
try {
  do {
    await processBatch(workerId, 5);
    if (process.argv.includes("--once")) break;
    if (!stopping) await setTimeout(1000);
  } while (!stopping);
} catch {
  console.error("WORKER_UNAVAILABLE");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
