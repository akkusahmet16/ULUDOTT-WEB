import Image from "next/image";
import type { SocialAccount } from "../domain/contact";
export function SocialIcon({
  icon,
  size = 28,
}: {
  icon: SocialAccount["icon"];
  size?: number;
}) {
  return icon === "link" ? (
    <svg
      width={size}
      height={size}
      style={{ width: size, height: "auto" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
    </svg>
  ) : (
    <Image
      className="social-logo"
      src={`/brand/social/${icon}.svg`}
      alt=""
      loading="eager"
      width={size}
      height={size}
      style={{ width: size, height: "auto" }}
    />
  );
}
