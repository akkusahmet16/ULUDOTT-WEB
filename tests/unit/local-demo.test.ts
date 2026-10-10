import { expect, it } from "vitest";
import { localDemoEnabled } from "../../src/lib/config/local-demo";

it.each(["localhost", "127.0.0.1", "[::1]"])(
  "permits an explicitly enabled local demo on %s",
  (host) =>
    expect(
      localDemoEnabled({
        NODE_ENV: "development",
        LOCAL_DEMO_MODE: "true",
        APP_URL: `http://${host}:3001`,
      }),
    ).toBe(true),
);

it.each([
  { NODE_ENV: "production", LOCAL_DEMO_MODE: "true", APP_URL: "http://127.0.0.1:3001" },
  { NODE_ENV: "development", LOCAL_DEMO_MODE: "false", APP_URL: "http://127.0.0.1:3001" },
  { NODE_ENV: "development", LOCAL_DEMO_MODE: "true", APP_URL: "https://uludott.com.tr" },
  { NODE_ENV: "development", LOCAL_DEMO_MODE: "true", APP_URL: "invalid" },
])("rejects disabled or remote demo context", (env) => {
  expect(localDemoEnabled(env)).toBe(false);
});
