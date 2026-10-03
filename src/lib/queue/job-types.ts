export type ClaimedJob = {
  id: string;
  type: string;
  aggregateId: string;
  revision: number;
  payload: Record<string, string>;
  attempts: number;
  leaseOwner: string;
};
export const MAX_ATTEMPTS = 5;
export const LEASE_SECONDS = 120;
export class JobError extends Error {
  readonly code: "UNKNOWN_JOB" | "LEASE_LOST" | "PROVIDER_FAILED";
  constructor(code: "UNKNOWN_JOB" | "LEASE_LOST" | "PROVIDER_FAILED") {
    super(code);
    this.code = code;
  }
}
export function jobErrorCode(error: unknown) {
  return error instanceof JobError ? error.code : "JOB_FAILED";
}
