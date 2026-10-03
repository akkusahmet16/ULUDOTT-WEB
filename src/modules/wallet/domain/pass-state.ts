export type Provider = "google" | "apple";
export type PassState = "pending" | "active" | "failed" | "revoked";
export function passState(
  eligibility: string,
  pass?: { status: string; revision: number; syncedRevision: number },
  revision?: number,
): PassState {
  if (eligibility === "revoked") return "revoked";
  if (eligibility !== "active" || !pass) return "pending";
  if (pass.status === "failed") return "failed";
  return pass.status === "ready" &&
    pass.syncedRevision === revision &&
    pass.revision === revision
    ? "active"
    : "pending";
}
