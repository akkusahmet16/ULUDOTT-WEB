import { describe, expect, it } from "vitest";
import { authCookiePolicy } from "../../src/lib/auth/cookie-policy";

describe("admin authentication cookie policy", () => {
  it("uses HTTP-compatible local cookie names on a loopback development URL", () => {
    expect(authCookiePolicy("http://127.0.0.1:3001")).toEqual({
      sessionName: "uludott_admin_local",
      csrfName: "uludott_csrf_local",
      secure: false,
    });
  });

  it("keeps host-prefixed secure cookies on HTTPS", () => {
    expect(authCookiePolicy("https://uludott.com.tr")).toEqual({
      sessionName: "__Host-uludott_admin",
      csrfName: "__Host-uludott_csrf",
      secure: true,
    });
  });
});
