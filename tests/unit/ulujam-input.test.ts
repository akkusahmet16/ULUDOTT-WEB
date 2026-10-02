import { describe, it, expect } from "vitest";
import {
  buildUlujamFormDefinition,
  validateUlujamInput,
} from "../../src/modules/applications/domain/ulujam-input";
import { evaluateVisibility } from "../../src/modules/forms/domain/condition";
import { validateFormDefinition } from "../../src/modules/forms/domain/form-version";
import { parseAnswer } from "../../src/modules/forms/domain/field-types";
const eventId = "90202700-0000-4000-8000-000000000001";
const base = {
  eventId,
  fullName: " DEMO kişi ",
  email: "DEMO@test.invalid",
  phone: "+905551234567",
  mode: "solo",
  skills: [{ skill: "software", level: 3 }],
};
describe("UluJam özel giriş", () => {
  it.each(["solo", "seeking", "new", "existing"])("%s modu", (mode) => {
    const input = {
      ...base,
      mode,
      ...(mode === "new"
        ? { teamName: "DEMO takım", expectedSize: 3 }
        : mode === "existing"
          ? {
              teamId: "10000000-0000-4000-8000-000000000001",
              password: "Test-password-42",
            }
          : {}),
    };
    expect(validateUlujamInput(input)).toMatchObject({
      mode,
      fullName: "DEMO kişi",
      email: "demo@test.invalid",
    });
  });
  it.each([undefined, "", "05551234567", "+0", 123])(
    "zorunlu E164 telefon %s",
    (phone) => expect(() => validateUlujamInput({ ...base, phone })).toThrow(),
  );
  it.each([0, 6, 1.5, "3", undefined])(
    "her seçilen beceride tamsayı 1–5: %s",
    (level) =>
      expect(() =>
        validateUlujamInput({
          ...base,
          skills: [{ skill: "software", level }],
        }),
      ).toThrow(),
  );
  it("boş, bilinmeyen ve tekrarlı beceriler reddedilir", () => {
    for (const skills of [
      [],
      [{ skill: "gamer", level: 3 }],
      [...base.skills, ...base.skills],
    ])
      expect(() => validateUlujamInput({ ...base, skills })).toThrow();
  });
  it("çoklu beceride açıklama zorunlu", () => {
    const skills = [...base.skills, { skill: "visual_art", level: 5 }];
    for (const skillDescription of [undefined, "", "  "])
      expect(() =>
        validateUlujamInput({ ...base, skills, skillDescription }),
      ).toThrow();
    expect(
      validateUlujamInput({
        ...base,
        skills,
        skillDescription: "DEMO yazılım ve çizim",
      }),
    ).toMatchObject({ skills });
  });
  it("mod alanları karışmaz ve oyuncu adı kabul edilmez", () => {
    for (const x of [
      { nickname: "demo" },
      { password: "hidden" },
      { teamName: "hidden" },
      { teamId: "10000000-0000-4000-8000-000000000001" },
      { expectedSize: 2 },
    ])
      expect(() => validateUlujamInput({ ...base, ...x })).toThrow();
    for (const x of [
      { mode: "new" },
      { mode: "new", teamName: "test", expectedSize: 1.5 },
      { mode: "existing" },
      { mode: "existing", teamId: "bad", password: "test" },
    ])
      expect(() => validateUlujamInput({ ...base, ...x })).toThrow();
  });
  it("şablon genel tanımla uyumlu; oyuncu adı/parola snapshot alanı yok", () => {
    const d = buildUlujamFormDefinition(eventId);
    expect(validateFormDefinition(d)).toEqual(d);
    expect(d.fields.map((f) => f.label).join(" ")).not.toMatch(
      /Oyuncu|Takma|Parola/,
    );
    const mode = d.fields.find((f) => f.label === "Katılım biçimi")!,
      skills = d.fields.find((f) => f.label === "Beceri alanları")!,
      note = d.fields.find((f) => f.label === "Becerilerinizin açıklaması")!;
    const level = d.fields.find((f) => f.label === "Yazılım seviyesi")!;
    expect(
      evaluateVisibility(d, { [mode.id]: "solo", [skills.id]: ["software"] }),
    ).toContain(level.id);
    expect(
      evaluateVisibility(d, { [mode.id]: "solo", [skills.id]: ["software"] }),
    ).not.toContain(note.id);
    expect(
      evaluateVisibility(d, {
        [mode.id]: "new",
        [skills.id]: ["software", "visual_art"],
      }),
    ).toContain(note.id);
    const team = d.fields.find((f) => f.label === "Takım adı")!;
    expect(evaluateVisibility(d, { [mode.id]: "new" })).toContain(team.id);
    expect(evaluateVisibility(d, { [mode.id]: "existing" })).not.toContain(
      team.id,
    );
    expect(() => buildUlujamFormDefinition("not-event")).toThrow();
  });
  it("Coffee Talk genel kısa metni UluJam kuralları gerektirmez", () => {
    const d = validateFormDefinition({
      fields: [
        {
          id: "10000000-0000-4000-8000-000000000099",
          type: "short_text",
          label: "Ad",
          required: true,
        },
      ],
    });
    expect(parseAnswer(d.fields[0], "DEMO kişi")).toBe("DEMO kişi");
  });
});
