import { it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  safeCell,
  serializeExport,
} from "../../src/modules/forms/application/export-submissions";
it.each([
  "=1+1",
  "+SUM(A1)",
  "-2+3",
  "@SUM(A1)",
  " \t=HYPERLINK(test)",
  "\r=1",
  "\ntext",
  "\ttext",
  "\uFEFF=1",
  "\u200B=1",
  "＝1+1",
])("formül metnini etkisizleştirir: %s", (value) => {
  expect(safeCell(value)).toBe("'" + value);
});
it("normal metin, quote ve newline korunur", () => {
  const text = 'Çağrı, "metin"\nikinci satır';
  expect(safeCell(text)).toBe(text);
});
it("CSV başlık/yanıt ve XLSX hücreleri güvenli string olur", async () => {
  const rows = [
    ["=başlık", "Yanıt"],
    ["=1+1", 'Çağrı, "metin"\nikinci satır'],
  ];
  const csv = await serializeExport(rows, "csv");
  expect(Buffer.from(csv).toString("utf8")).toContain('"\'=1+1"');
  const data = await serializeExport(rows, "xlsx");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(Uint8Array.from(data).buffer);
  const sheet = book.worksheets[0];
  expect(sheet.getCell("A1").value).toBe("'=başlık");
  expect(sheet.getCell("A2").value).toBe("'=1+1");
  expect(sheet.getCell("A2").type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell("A2").formula).toBeUndefined();
  expect(sheet.getCell("B2").value).toBe(rows[1][1]);
});
