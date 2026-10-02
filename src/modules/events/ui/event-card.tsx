import { ContentCard } from "../../publication/ui/content-view";
import type { PublicContent } from "../../publication/domain";
export function EventCard({ event }: { event: PublicContent }) {
  return <ContentCard item={event} type="event" />;
}
