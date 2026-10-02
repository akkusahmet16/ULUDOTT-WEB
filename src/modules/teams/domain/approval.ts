import { z } from "zod";
export const decisionSchema = z.enum([
  "approved",
  "rejected",
  "changes_requested",
]);
export type ApprovalDecision = z.infer<typeof decisionSchema>;
export function validateDecision(
  current: string,
  next: ApprovalDecision,
  reason?: string,
) {
  if (
    !["pending", "approved", "rejected", "changes_requested"].includes(current)
  )
    throw Error("Durum geçişi geçersiz");
  if (next !== "approved")
    return z.string().trim().min(1).max(1000).parse(reason);
  return null;
}
