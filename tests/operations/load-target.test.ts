import { it, expect, vi } from "vitest";
import { fetchLocalPublic } from "../load/local-public";
it("load traffic stays on the fixture even with an external override and rejects redirects", async () => {
  const old = process.env.LOAD_PUBLIC_URL;
  process.env.LOAD_PUBLIC_URL = "https://unauthorized.invalid/";
  try {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("DEMO"));
    await fetchLocalPublic("/", fetcher);
    expect(String(fetcher.mock.calls[0][0])).toBe("http://127.0.0.1:3100/");
    expect(fetcher.mock.calls[0][1]?.redirect).toBe("error");
    fetcher.mockClear();
    await expect(
      fetchLocalPublic("https://unauthorized.invalid/", fetcher),
    ).rejects.toThrow("LOCAL_LOAD_TARGET_REQUIRED");
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    if (old === undefined) delete process.env.LOAD_PUBLIC_URL;
    else process.env.LOAD_PUBLIC_URL = old;
  }
});
