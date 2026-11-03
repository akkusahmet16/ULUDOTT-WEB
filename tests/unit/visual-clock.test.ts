import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

it("fixes both UI time APIs and retains explicit-date construction and callable Date", () => {
  const epoch = Date.parse("2026-10-22T12:00:00Z");
  const output = execFileSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(resolve("tests/helpers/visual-clock.mjs")).href,
      "--input-type=module",
      "-e",
      "console.log(JSON.stringify([Date.now(),new Date().getTime(),new Date(0).getTime(),Date.parse('2000-01-01T00:00:00Z'),Date()===new Date().toString(),new Date() instanceof Date]))",
    ],
    {
      env: { ...process.env, ULUDOTT_VISUAL_EPOCH: String(epoch) },
      encoding: "utf8",
    },
  );
  expect(JSON.parse(output)).toEqual([
    epoch,
    epoch,
    0,
    946684800000,
    true,
    true,
  ]);
});

it("leaves native timers and monotonic time untouched", () => {
  const script =
    "const nativeTimer=setTimeout,nativePerformance=performance.now;const before=performance.now();const {installFixedDate}=await import('./tests/helpers/visual-clock-script.mjs');installFixedDate(1792670400000);await new Promise(done=>setTimeout(done,10));console.log(JSON.stringify([setTimeout===nativeTimer,performance.now===nativePerformance,performance.now()>before,Date.now()===1792670400000]))";
  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8", timeout: 5000 },
  );
  expect(JSON.parse(output)).toEqual([true, true, true, true]);
});
