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
  discord: {
    id: "discord",
    kind: "inline-svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
    strokeWidth: "0",
    defaultSize: 28,
    paths: [
      "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
    ],
  },
  linkedin: {
    id: "linkedin",
    kind: "inline-svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
    strokeWidth: "0",
    defaultSize: 28,
    paths: [
      "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
    ],
  },
  kick: {
    id: "kick",
    kind: "inline-svg",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
    strokeWidth: "0",
    defaultSize: 28,
    paths: [
      "M4 3h5v5h3V5h4V3h4v8h-4v2h4v8h-4v-2h-4v-3H9v5H4V3z",
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
        className={className}
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
