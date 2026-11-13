import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getSozlukAuthorFromCookies } from "./sozluk-http.ts";

/** Aynı istek içinde layout + page + metadata çağrılarını tekilleştirir. */
export const getSozlukRequestContext = cache(async () => {
  const [headerStore, viewer] = await Promise.all([
    headers(),
    getSozlukAuthorFromCookies(),
  ]);
  const isSubdomain = headerStore.get("x-sozluk-host") === "1";
  return { isSubdomain, viewer };
});
