const origin = "http://127.0.0.1:3100";
export async function fetchLocalPublic(path: string, fetcher: typeof fetch) {
  const target = new URL(path, origin);
  if (target.origin !== origin) throw new Error("LOCAL_LOAD_TARGET_REQUIRED");
  return fetcher(target, { redirect: "error" });
}
