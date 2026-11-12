import "server-only";
import { headers } from "next/headers";
import { getSozlukAuthorFromCookies } from "./sozluk-http.ts";

export async function getSozlukRequestContext() {
  const [headerStore, viewer] = await Promise.all([
    headers(),
    getSozlukAuthorFromCookies(),
  ]);
  const isSubdomain = headerStore.get("x-sozluk-host") === "1";
  return { isSubdomain, viewer };
}
