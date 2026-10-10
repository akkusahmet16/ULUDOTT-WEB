export const LOCAL_DEMO_FORM_SLUG = "demo-ulujam-yerel";

export function localDemoEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.LOCAL_DEMO_MODE !== "true" || env.NODE_ENV === "production")
    return false;
  try {
    const url = new URL(env.APP_URL ?? "");
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}
