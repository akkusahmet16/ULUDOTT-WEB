import { ContentCard } from "../../publication/ui/content-view";
import type { PublicContent } from "../../publication/domain";
export function AnnouncementCard({
  announcement,
}: {
  announcement: PublicContent;
}) {
  return <ContentCard item={announcement} type="announcement" />;
}
