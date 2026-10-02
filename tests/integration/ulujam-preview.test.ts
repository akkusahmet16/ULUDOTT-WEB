import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { getUlujamPreview } from "../../src/modules/applications/application/ulujam-preview";
it("UluJam önizleme etkinlik kapsamını ve gerçek takım listesini korur; veri yazmaz", async () => {
  const local = await createTestDatabase(),
    old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  try {
    await migrateEmptyDatabase();
    const id = randomUUID(),
      other = randomUUID(),
      general = randomUUID(),
      team = randomUUID();
    await local.sql`insert into events(id,title,slug,kind) values(${id},'Test UluJam','ulujam-preview','ulujam'),(${other},'Other','other-ulujam','ulujam'),(${general},'General','general','general')`;
    await local.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${team},${id},'DEMO takım','demo takım',3),(${randomUUID()},${other},'Başka takım','başka takım',2)`;
    const actor = {
      adminId: randomUUID(),
      roles: ["event_manager"],
      eventScopes: [id, general],
    };
    await expect(
      getUlujamPreview({ ...actor, eventScopes: [] }, id),
    ).rejects.toThrow();
    await expect(
      getUlujamPreview({ ...actor, roles: ["system_admin"] }, id),
    ).rejects.toThrow();
    await expect(getUlujamPreview(actor, general)).rejects.toThrow();
    const result = await getUlujamPreview(actor, id);
    expect(result).toMatchObject({
      eventId: id,
      teams: [{ id: team, name: "DEMO takım" }],
    });
    expect(
      (await local.sql`select count(*)::int as count from applications`)[0]
        .count,
    ).toBe(0);
    expect(
      (await local.sql`select count(*)::int as count from submissions`)[0]
        .count,
    ).toBe(0);
  } finally {
    await closeDatabase();
    await local.cleanup();
    process.env.DATABASE_URL = old;
  }
});
