import { expect, it } from "vitest";
import { securityHeaders, routeClass } from "../../src/lib/security/headers";
import { edgeDecision } from "../../src/lib/security/edge-policy";
it("Private cards, submissions and admin have no-store/no-referrer; production CSP uses nonce, never unsafe script inline", () => {
  for (const path of [
    "/admin",
    "/admin/sistem",
    "/kart/guess",
    "/takim/guess",
    "/api/submissions/receipt",
    "/api/ulujam/apply",
  ]) {
    const h = securityHeaders(routeClass(path), "abcdefghijklmnopqrstuv", true);
    expect(h["Cache-Control"]).toBe("no-store");
    expect(h["Referrer-Policy"]).toBe("no-referrer");
    expect(h["Content-Security-Policy"]).toContain(
      "'nonce-abcdefghijklmnopqrstuv'",
    );
    expect(
      h["Content-Security-Policy"]
        .split(";")
        .find((x) => x.includes("script-src")),
    ).not.toContain("unsafe-inline");
    expect(h["Strict-Transport-Security"]).toBeDefined();
  }
  expect(
    securityHeaders("public", "abcdefghijklmnopqrstuv", false)[
      "Strict-Transport-Security"
    ],
  ).toBeUndefined();
});
it("Perimeter accepts Turkish text, search punctuation, RSC navigation and a valid upload; rejects declared oversized bodies and wrong origin gate", () => {
  expect(
    edgeDecision(
      new Request("https://example.test/api/forms/a/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "200",
        },
        body: '{"text":"Özgür; <örnek>"}',
      }),
    ),
  ).toBeNull();
  expect(
    edgeDecision(
      new Request("https://example.test/admin?q=%27%20OR%201%3D1", {
        headers: { rsc: "1" },
      }),
    ),
  ).toBeNull();
  expect(
    edgeDecision(
      new Request("https://example.test/api/admin/media", {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=x",
          "content-length": "8000000",
        },
        body: "x",
      }),
    ),
  ).toBeNull();
  expect(
    edgeDecision(
      new Request("https://example.test/api/forms/a/submit", {
        method: "POST",
        headers: { "content-length": "99999999" },
        body: "x",
      }),
    ),
  ).toBe(413);
  expect(
    edgeDecision(
      new Request("https://example.test/_next/static/app.js"),
      "only-edge",
    ),
  ).toBe(403);
  expect(
    edgeDecision(
      new Request("https://example.test/_next/static/app.js", {
        headers: { "x-uludott-origin": "only-edge" },
      }),
      "only-edge",
    ),
  ).toBeNull();
});
it("Only public pages permit the privacy-enhanced UluJam video frame", () => {
  expect(
    securityHeaders("public", "abcdefghijklmnopqrstuv", true)[
      "Content-Security-Policy"
    ],
  ).toContain("https://www.youtube-nocookie.com");
  for (const route of [
    "/admin",
    "/kart/a",
    "/takim/a",
    "/api/submissions/receipt",
  ])
    expect(
      securityHeaders(routeClass(route), "abcdefghijklmnopqrstuv", true)[
        "Content-Security-Policy"
      ],
    ).not.toContain("youtube");
});
