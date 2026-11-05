import type { Metadata } from "next";
import {
  getRoute,
  resolveCanonicalPath,
  type RouteId,
} from "../config/routes.config.ts";
import { DEFAULT_LOCALE, type Locale } from "../i18n/config.ts";
import { getTranslator } from "../i18n/translate.ts";

export interface BuildMetadataImage {
  readonly id: string;
  readonly altText: string;
  readonly width: number;
  readonly height: number;
}

export interface BuildMetadataContent {
  readonly title?: string | null;
  readonly description?: string | null;
  readonly notFound?: boolean;
  readonly baseUrl?: string;
  readonly image?: BuildMetadataImage | null;
  readonly includeSocialCards?: boolean;
}

export interface BuildMetadataInput {
  readonly routeId: RouteId;
  readonly locale?: Locale;
  readonly params?: Readonly<Record<string, string>>;
  readonly searchParams?: Readonly<
    Record<string, string | readonly string[] | undefined>
  >;
  readonly content?: BuildMetadataContent | null;
}

const TRAILING_BRAND_PATTERN =
  /(?:\s*(?:—|–|-|\|)\s*(?:Uludott|ULUDOTT))+\s*$/i;
const LEADING_DUPLICATE_BRAND_PATTERN =
  /^(?:Uludott|ULUDOTT)\s*(?:—|–|-|\|)\s*(.+)$/i;

/**
 * Sayfa başlığından mükerrer marka eklerini ("— Uludott", "| ULUDOTT" vb.) temizler.
 * Böylece kök şablon (`%s | ULUDOTT`) markayı yalnızca tek kez ekler ve
 * "— Uludott | ULUDOTT" tekrarı oluşmaz.
 */
export function normalizeBrandlessTitle(rawTitle: string): string {
  let cleaned = rawTitle.trim();
  if (!cleaned) return "Uludott";
  cleaned = cleaned.replace(TRAILING_BRAND_PATTERN, "").trim();
  const leadingMatch = LEADING_DUPLICATE_BRAND_PATTERN.exec(cleaned);
  if (leadingMatch?.[1]?.trim()) {
    cleaned = leadingMatch[1].trim();
  }
  return cleaned || "Uludott";
}

export function formatDocumentTitle(
  rawTitle: string,
  brandUpper = "ULUDOTT",
): string {
  return `${normalizeBrandlessTitle(rawTitle)} | ${brandUpper}`;
}

/**
 * DB'ye erişmeyen saf metadata üreticisi.
 * - Ham CMS başlık/açıklama `content` parametresinden alınır.
 * - Hatalı slug / 404 durumlarında ve indeks dışı rotalarda `noindex, nofollow` üretir.
 * - Özel token veya sorgu parametrelerini canonical/openGraph/twitter alanlarına sızdırmaz.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const route = getRoute(input.routeId);
  const t = getTranslator(locale);

  // 1. İndekslenemeyen özel/operasyonel rotalar (başvuru, makbuz, kart, takım, yayın onayı)
  if (!route.indexable) {
    const rawTitle =
      input.content?.title?.trim() || t(route.metadataKey.titleKey);
    const metadata: Metadata = {
      title: normalizeBrandlessTitle(rawTitle),
      robots: { index: false, follow: false },
    };
    if (route.visibility === "private-token") {
      metadata.referrer = "no-referrer";
    }
    return metadata;
  }

  // 2. Dinamik rotada 404 / bulunamadı durumu
  if (input.content?.notFound) {
    return {
      ...(route.metadataKey.notFoundTitleKey
        ? {
            title: normalizeBrandlessTitle(
              t(route.metadataKey.notFoundTitleKey),
            ),
          }
        : {}),
      robots: { index: false, follow: false },
    };
  }

  // 3. Kanonik yol doğrulaması (hatalı veya güvensiz slug'lar noindex'e düşer)
  let canonicalPath: string | null = null;
  try {
    canonicalPath = resolveCanonicalPath(route.id, {
      params: input.params,
      searchParams: input.searchParams,
    });
  } catch {
    return {
      ...(route.metadataKey.notFoundTitleKey
        ? {
            title: normalizeBrandlessTitle(
              t(route.metadataKey.notFoundTitleKey),
            ),
          }
        : {}),
      robots: { index: false, follow: false },
    };
  }

  if (!canonicalPath) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = input.content?.baseUrl
    ? new URL(canonicalPath, input.content.baseUrl).toString()
    : canonicalPath;

  const rawTitle =
    input.content?.title?.trim() ||
    t(route.metadataKey.titleKey, {
      title: input.content?.title?.trim() || t("brand.name"),
    });
  const title = normalizeBrandlessTitle(rawTitle);

  const hasExplicitDescription =
    input.content !== undefined &&
    input.content !== null &&
    Object.prototype.hasOwnProperty.call(input.content, "description");

  const description = hasExplicitDescription
    ? input.content?.description?.trim() || undefined
    : t(route.metadataKey.descriptionKey, {
        description: t("brand.defaultDescription"),
      }).trim() || undefined;

  const result: Metadata = {
    title,
    ...(description ? { description } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
  };

  if (input.content?.includeSocialCards || input.content?.baseUrl) {
    const baseForMedia = input.content?.baseUrl ?? "https://uludott.local";
    const image = input.content?.image;
    const imageUrl = image
      ? new URL(
          `/media/${encodeURIComponent(image.id)}`,
          baseForMedia,
        ).toString()
      : null;

    result.openGraph = {
      title,
      description,
      url: canonicalUrl,
      images:
        image && imageUrl
          ? [
              {
                url: imageUrl,
                alt: image.altText,
                width: image.width,
                height: image.height,
              },
            ]
          : [],
    };
    result.twitter = {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    };
  }

  return result;
}
