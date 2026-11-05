import { Icon } from "../../../components/ui/icons/index.tsx";
import type { SocialAccount } from "../domain/contact";
export function SocialIcon({
  icon,
  size = 28,
}: {
  icon: SocialAccount["icon"];
  size?: number;
}) {
  return <Icon id={icon} size={size} decorative />;
}
