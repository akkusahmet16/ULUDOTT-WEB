export type CardStatus = "pending" | "active" | "revoked";
export function cardEligibility(
  participant: {
    status: string;
    mode: string;
    expired?: boolean;
    eventClosed?: boolean;
  },
  teamApproval?: { status: string; memberApproved: boolean } | null,
): CardStatus {
  if (
    participant.expired ||
    participant.eventClosed ||
    ["rejected", "withdrawn"].includes(participant.status)
  )
    return "revoked";
  if (participant.mode === "solo")
    return participant.status === "approved" ? "active" : "pending";
  if (teamApproval && ["rejected", "withdrawn"].includes(teamApproval.status))
    return "revoked";
  if (
    teamApproval?.memberApproved &&
    ["approved", "changes_requested"].includes(teamApproval.status)
  )
    return "active";
  return "pending";
}
