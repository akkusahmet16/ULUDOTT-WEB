import {
  APP_TIME_ZONE,
  isLocale,
  LOCALE_TAGS,
  type Locale,
} from "./config.ts";

function assertValidLocale(locale: unknown): asserts locale is Locale {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale for formatting: "${String(locale)}"`);
  }
}

function toValidDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid Date instance passed to formatter");
    }
    return value;
  }
  if (typeof value === "string" && value.trim().length === 0) {
    throw new Error("Empty date string passed to formatter");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value passed to formatter: "${String(value)}"`);
  }
  return parsed;
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  assertValidLocale(locale);
  const date = toValidDate(value);
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatDateTime(
  value: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  assertValidLocale(locale);
  const date = toValidDate(value);
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  assertValidLocale(locale);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid number passed to formatNumber: "${String(value)}"`);
  }
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value);
}

export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: Locale,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  assertValidLocale(locale);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Invalid value passed to formatRelativeTime: "${String(value)}"`,
    );
  }
  return new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], {
    numeric: "auto",
    ...options,
  }).format(value, unit);
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  readonly other: string;
};

export function selectPlural(
  count: number,
  forms: PluralForms,
  locale: Locale,
): string {
  assertValidLocale(locale);
  if (typeof count !== "number" || !Number.isFinite(count)) {
    throw new Error(`Invalid count passed to selectPlural: "${String(count)}"`);
  }
  const category = new Intl.PluralRules(LOCALE_TAGS[locale]).select(count);
  const template = forms[category] ?? forms.other;
  const formattedCount = formatNumber(count, locale);
  return template.replace(/\{count\}/g, formattedCount);
}
