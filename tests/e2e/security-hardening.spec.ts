import { test, expect } from "@playwright/test";
test("Nonce CSP preserves hydration and rejects injected inline script; private APIs never cache", async ({
  page,
  request,
}) => {
  const r = await page.goto("/ulujam");
  const csp = r!.headers()["content-security-policy"];
  expect(csp).toContain("'strict-dynamic'");
  const nonce = csp.match(/'nonce-([^']+)'/)![1];
  expect(
    await page
      .locator("script")
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => n.hasAttribute("src") || n.textContent)
          .every((n) => (n as HTMLScriptElement).nonce.length > 0),
      ),
  ).toBe(true);
  // Browser parser, rather than DevTools evaluation (which is privileged), exercises CSP.
  await page.route("**/ulujam", async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      "<head>",
      "<head><script>window.uludottInjected=true</script>",
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto("/ulujam");
  expect(
    await page.evaluate(() => Object.hasOwn(window, "uludottInjected")),
  ).toBe(false);
  const other = await request.get("/ulujam");
  expect(other.headers()["content-security-policy"]).not.toContain(
    "'nonce-" + nonce + "'",
  );
  for (const path of [
    "/admin/sistem",
    "/api/admin/session",
    "/kart/not-a-token",
  ]) {
    const r = await request.get(path);
    expect(r.headers()["cache-control"]).toContain("no-store");
    expect(r.headers()["referrer-policy"]).toBe("no-referrer");
  }
});
