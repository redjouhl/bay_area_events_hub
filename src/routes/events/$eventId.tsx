import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Building2, Ticket } from "lucide-react";
import { getEventById } from "@/lib/events.functions";
import { isFreeEvent, isSoldOut } from "@/data/concerts";
import { formatDateLabel, ShareButton } from "@/components/ConcertCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/events/$eventId")({
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId }).catch(() => null);
    return { event };
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event;
    if (!event) {
      return { meta: [{ title: "Event not found · Outsy" }] };
    }
    const dateLabel = formatDateLabel([event.date]);
    const description = `${event.artist} at ${event.venue}, ${event.city} on ${dateLabel}.`;
    return {
      meta: [
        { title: `${event.artist} · Outsy` },
        { name: "description", content: description },
        { property: "og:title", content: `${event.artist} · Outsy` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(event.imageUrl ? [{ property: "og:image", content: event.imageUrl }] : []),
        { name: "twitter:card", content: event.imageUrl ? "summary_large_image" : "summary" },
      ],
    };
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { event } = Route.useLoaderData();

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl text-foreground">Event not found</h1>
          <p className="mt-2 text-muted-foreground">
            This event may have been removed, or the link isn't quite right.
          </p>
          <Link to="/" className="mt-6 inline-block text-primary underline decoration-primary/50 underline-offset-4">
            Back to Outsy
          </Link>
        </div>
      </div>
    );
  }

  const isMuseum = event.category === "museums_exhibits";
  const isFree = isFreeEvent(event);
  const soldOut = isSoldOut(event);
  const dateLabel = formatDateLabel([event.date]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to all events
        </Link>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {soldOut && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
              Sold Out
            </span>
          )}
          <div className="aspect-[16/9] overflow-hidden">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="gradient-surface flex h-full w-full items-center justify-center text-4xl font-semibold text-white/90">
                {event.artist.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="secondary" className="border-transparent bg-sunset uppercase tracking-wider text-white shadow-sm">
                {event.genre}
              </Badge>
              <ShareButton concert={event} />
            </div>

            <h1 className="mt-4 text-4xl leading-none text-foreground">{event.artist}</h1>
            {event.support && (
              <p className="mt-1 text-muted-foreground">{isMuseum ? event.support : `with ${event.support}`}</p>
            )}

            <dl className="mt-5 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>
                  {dateLabel} · {event.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isMuseum ? <Building2 className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                <span>
                  {event.venue}, {event.city}
                </span>
              </div>
            </dl>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
              <div className="min-w-0">
                <p className="text-display text-2xl text-foreground break-words">{event.price}</p>
                <p className="text-xs text-muted-foreground">via {event.source}</p>
              </div>
              <Button asChild size="sm" variant={soldOut ? "secondary" : "default"} className="font-semibold uppercase tracking-wide">
                <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  <Ticket className="mr-1 h-4 w-4" /> {soldOut ? "Sold Out" : isFree ? "Event Info" : isMuseum ? "Visit" : "Tickets"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
