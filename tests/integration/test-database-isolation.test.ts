import { loadEnvFile } from "node:process";
import { expect, it } from "vitest";
import { createTestDatabase } from "../helpers/local-database";

it("keeps a database query parameter from redirecting the test connection", async () => {
  loadEnvFile(".env.local");
  const original = process.env.DATABASE_URL;
  const configured = new URL(original!);
  configured.searchParams.set(
    "database",
    decodeURIComponent(configured.pathname.slice(1)),
  );
  let local: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  try {
    process.env.DATABASE_URL = configured.toString();
    local = await createTestDatabase();
    // Inspect the server-selected database without migrating or writing its data.
    const [row] = await local.sql`select current_database() as name`;
    expect(row.name).toMatch(/^uludott_test_[a-f0-9]{32}$/);
    expect(row.name).toBe(new URL(local.url).pathname.slice(1));
  } finally {
    try {
      await local?.cleanup();
    } finally {
      if (original === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = original;
    }
  }
});
