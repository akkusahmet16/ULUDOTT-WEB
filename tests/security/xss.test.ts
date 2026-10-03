import { expect, it } from "vitest";
import { validateExternalUrl } from "../../src/lib/security/url-policy";
it("External links reject script protocols, credentials, private IPs and encoded backslashes; accept ordinary official HTTPS links", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://u:p@example.com/",
    "https://127.0.0.1/x",
    "https://[::1]/x",
    "https://169.254.169.254/",
    "https://example.com/%5cfoo",
    "//evil.test",
    "https://localhost/",
  ])
    expect(() => validateExternalUrl(url, "link")).toThrow();
  expect(validateExternalUrl("https://uludott.com/etkinlik?x=1", "link")).toBe(
    "https://uludott.com/etkinlik?x=1",
  );
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BotChallenge } from "../../src/modules/forms/ui/bot-challenge";
it("A required widget without a public site key shows a configuration error instead of suggesting protection is ready", () => {
  const html = renderToStaticMarkup(
    createElement(BotChallenge, {
      config: { required: true, siteKey: "" },
      action: "form_submit",
      resetKey: 0,
      onToken: () => {},
    }),
  );
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("<script");
});
