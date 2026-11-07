import Image from "next/image";

export const ICON_IDS = [
  "instagram",
  "whatsapp",
  "x",
  "youtube",
  "discord",
  "linkedin",
  "kick",
  "link",
  "text",
] as const;

export type IconId = (typeof ICON_IDS)[number];

export interface InlineSvgIconEntry {
  readonly id: IconId;
  readonly kind: "inline-svg";
  readonly viewBox: string;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: string;
  readonly defaultSize: number;
  readonly paths: readonly string[];
}

export interface BrandAssetIconEntry {
  readonly id: IconId;
  readonly kind: "brand-asset";
  readonly src: string;
  readonly className: string;
  readonly viewBox: string;
  readonly colorMode: "intrinsic-svg";
  readonly defaultSize: number;
}

export type IconRegistryEntry = InlineSvgIconEntry | BrandAssetIconEntry;

export const ICON_REGISTRY: Readonly<Record<IconId, IconRegistryEntry>> = {
  instagram: {
    id: "instagram",
    kind: "brand-asset",
    src: "/brand/social/instagram.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  whatsapp: {
    id: "whatsapp",
    kind: "brand-asset",
    src: "/brand/social/whatsapp.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  x: {
    id: "x",
    kind: "brand-asset",
    src: "/brand/social/x.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  youtube: {
    id: "youtube",
    kind: "brand-asset",
    src: "/brand/social/youtube.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  discord: {
    id: "discord",
    kind: "brand-asset",
    src: "/brand/social/discord.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  linkedin: {
    id: "linkedin",
    kind: "brand-asset",
    src: "/brand/social/linkedin.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  kick: {
    id: "kick",
    kind: "brand-asset",
    src: "/brand/social/kick.svg",
    className: "social-logo",
    viewBox: "0 0 24 24",
    colorMode: "intrinsic-svg",
    defaultSize: 28,
  },
  link: {
    id: "link",
    kind: "inline-svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    defaultSize: 28,
    paths: [
      "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
    ],
  },
  text: {
    id: "text",
    kind: "inline-svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    defaultSize: 28,
    paths: [
      "M4 7V4h16v3M9 20h6M12 4v16",
    ],
  },
} as const;

export function isIconId(value: unknown): value is IconId {
  return (
    typeof value === "string" &&
    (ICON_IDS as readonly string[]).includes(value)
  );
}

export function getIconEntry(id: IconId): IconRegistryEntry {
  if (!isIconId(id)) {
    throw new Error(`Unknown IconId: "${String(id)}"`);
  }
  return ICON_REGISTRY[id];
}

export interface IconProps {
  readonly id: IconId;
  readonly label?: string;
  readonly decorative?: boolean;
  readonly size?: number;
  readonly className?: string;
}

export function Icon({
  id,
  label,
  decorative,
  size,
  className,
}: IconProps) {
  const entry = getIconEntry(id);
  const resolvedSize = size ?? entry.defaultSize;
  const trimmedLabel = label?.trim() ?? "";

  if (decorative === false && trimmedLabel.length === 0) {
    throw new Error(
      `Meaningful icon "${id}" (decorative=false) requires a non-empty accessible label`,
    );
  }

  const isDecorative =
    decorative === true || (decorative === undefined && trimmedLabel.length === 0);

  if (entry.kind === "inline-svg") {
    return (
      <svg
        width={resolvedSize}
        height={resolvedSize}
        style={{ width: resolvedSize, height: "auto" }}
        viewBox={entry.viewBox}
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={entry.strokeWidth}
        className={className ?? "social-logo"}
        {...(isDecorative
          ? { "aria-hidden": "true" as const }
          : { role: "img" as const, "aria-label": trimmedLabel })}
      >
        {entry.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }

  return (
    <Image
      className={className ?? entry.className}
      src={entry.src}
      alt={isDecorative ? "" : trimmedLabel}
      loading="eager"
      width={resolvedSize}
      height={resolvedSize}
      style={{ width: resolvedSize, height: "auto" }}
    />
  );
}
