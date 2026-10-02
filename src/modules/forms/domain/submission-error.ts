export class SubmissionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "SubmissionError";
  }
}
