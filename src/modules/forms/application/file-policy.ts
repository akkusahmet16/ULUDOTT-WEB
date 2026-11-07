import "server-only";
import { randomUUID } from "node:crypto";
import { SubmissionError } from "../domain/submission-error.ts";

export const MAX_FORM_FILE_BYTES = 5 * 1024 * 1024;
const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function validateFormFile(file: File) {
  if (!file.size || file.size > MAX_FORM_FILE_BYTES || !allowed.has(file.type))
    throw new SubmissionError(400, "Dosya PDF, PNG, JPEG veya WebP olmalı ve 5 MiB sınırını aşmamalı");
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = file.type;
  const signature = type === "application/pdf"
    ? bytes.subarray(0, 5).toString() === "%PDF-"
    : type === "image/png"
      ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : type === "image/jpeg"
        ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!signature) throw new SubmissionError(400, "Dosya türü içerikle eşleşmiyor");
  const fileName = file.name.replace(/[\\/\u0000-\u001f\u007f]/g, "_").trim().slice(0, 250);
  if (!fileName) throw new SubmissionError(400, "Dosya adı gerekli");
  return { id: randomUUID(), fileName, mimeType: type, bytes };
}
