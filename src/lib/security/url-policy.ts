export function validateExternalUrl(
  value: string,
  policy: "link" | "itch" = "link",
): string {
  if (
    value.length > 2000 ||
    /[\s\\\u0000-\u001f\u007f]/u.test(value) ||
    /%(?:5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)
  )
    throw Error("URL_POLICY");
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    throw Error("URL_POLICY");
  }
  const hostname = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    !hostname.includes(".") ||
    /^[0-9.]+$/.test(hostname) ||
    hostname.includes(":") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  )
    throw Error("URL_POLICY");
  if (policy === "itch" && !/^[a-z0-9-]+\.itch\.io$/.test(hostname))
    throw Error("URL_POLICY");
  return u.href;
}
