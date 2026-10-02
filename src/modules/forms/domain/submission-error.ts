export class SubmissionError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "SubmissionError";
    this.status = status;
  }
}
