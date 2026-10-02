import { it, expect } from "vitest";
import { countdownState } from "../../src/modules/events/ui/countdown";
it("tarih yok/geri çekilmişse yalnız Yakında döner", () => {
  expect(countdownState(null, new Date())).toEqual({ kind: "coming_soon" });
});
it("gerçek gelecek tarih saniye sınırında sayılır", () => {
  expect(
    countdownState(
      new Date("2030-01-01T00:00:02Z"),
      new Date("2030-01-01T00:00:00Z"),
    ),
  ).toEqual({ kind: "counting", seconds: 2 });
});
it("başlangıç dahil etkinlik başladı olur", () => {
  expect(
    countdownState(new Date("2030-01-01"), new Date("2030-01-01")),
  ).toEqual({ kind: "started" });
  expect(
    countdownState(new Date("2030-01-01"), new Date("2031-01-01")),
  ).toEqual({ kind: "started" });
});
it("geçersiz tarih Yakında olur", () => {
  expect(countdownState(new Date("invalid"), new Date())).toEqual({
    kind: "coming_soon",
  });
});
