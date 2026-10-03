import { enforceRateLimit } from "../../../lib/security/rate-limit.ts";
export async function teamRate(scope: string, key: string, limit = 10) {
  await enforceRateLimit(scope, key, { limit, windowSeconds: 60 });
}
