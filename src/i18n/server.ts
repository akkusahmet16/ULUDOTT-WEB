import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { COOKIE_KEYS } from "../config/storage-keys.ts";
import { isAdminPathname } from "../config/theme.config.ts";
import {
  ADMIN_LOCALE,
  CLIENT_NAMESPACES,
  DEFAULT_LOCALE,
  isClientNamespace,
  resolveLocale,
  type ClientNamespace,
  type Locale,
} from "./config.ts";
import {
  adminTrDictionary,
  type AdminDictionary,
} from "./dictionaries/admin-tr.ts";
import type { PublicDictionary } from "./dictionaries/tr.ts";
import { getDictionary, getTranslator, type TranslateFn } from "./translate.ts";

export type DictionarySlice<N extends ClientNamespace = ClientNamespace> = Pick<
  PublicDictionary,
  N
>;

export interface RequestLocaleContext {
  readonly pathname?: string | null;
  readonly cookieLocale?: unknown;
}

/**
 * Rota ve çerez bağlamından dili saf olarak çözümler:
 * - `/admin` ve `/admin/*` rotalarında çerez ne olursa olsun `"tr"` döner.
 * - Genel rotalarda yalnızca beyaz listedeki (`tr` | `en`) çerez kabul edilir;
 *   tanımsız veya geçersiz çerezde varsayılan `"tr"` döner.
 */
export function resolveRequestLocaleFromContext(
  context: RequestLocaleContext,
): Locale {
  if (isAdminPathname(context.pathname)) {
    return ADMIN_LOCALE;
  }
  return resolveLocale(context.cookieLocale);
}

const readRequestLocaleCached = cache(async (): Promise<Locale> => {
  try {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname");
    if (isAdminPathname(pathname)) {
      return ADMIN_LOCALE;
    }
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(COOKIE_KEYS.locale)?.value;
    return resolveRequestLocaleFromContext({
      pathname,
      cookieLocale: rawCookie,
    });
  } catch {
    return DEFAULT_LOCALE;
  }
});

/**
 * İstek çerezinden (`uludott-lang`) ve rota bağlamından dili çözümler.
 * - `/admin` ve `/admin/*` rotalarında her zaman `tr` döner.
 * - Tarayıcı `Accept-Language` başlığıyla otomatik EN açılmaz.
 * - Geçersiz veya tanımsız çerez değerlerinde varsayılan `tr` döner.
 */
export async function getLocale(): Promise<Locale> {
  return readRequestLocaleCached();
}

export async function getRequestTranslator(
  explicitLocale?: Locale,
): Promise<TranslateFn> {
  if (explicitLocale !== undefined) {
    return getTranslator(resolveLocale(explicitLocale));
  }
  const locale = await getLocale();
  return getTranslator(locale);
}

export function getDictionarySlice<N extends ClientNamespace>(
  locale: Locale,
  namespace: N | readonly N[],
): Pick<PublicDictionary, N> {
  const resolvedLocale = resolveLocale(locale);
  const dictionary = getDictionary(resolvedLocale);
  const namespaces = (
    Array.isArray(namespace) ? namespace : [namespace]
  ) as readonly N[];

  if (namespaces.length === 0) {
    throw new Error(
      "getDictionarySlice requires at least one ClientNamespace",
    );
  }

  const slice: Partial<Record<ClientNamespace, unknown>> = {};
  for (const ns of namespaces) {
    if (!isClientNamespace(ns)) {
      throw new Error(
        `Namespace "${String(ns)}" is not allowed in CLIENT_NAMESPACES (${CLIENT_NAMESPACES.join(", ")})`,
      );
    }
    slice[ns] = dictionary[ns];
  }

  return slice as Pick<PublicDictionary, N>;
}

export function getAdminDictionary(): AdminDictionary {
  return adminTrDictionary;
}
