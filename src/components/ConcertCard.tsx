import { CalendarDays, MapPin, Ticket, Flame, Heart, Building2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Concert } from "@/data/concerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function ConcertCard({ concert }: { concert: Concert }) {
  const { isFavorite, toggleFavorite, canFavorite } = useFavorites();
  const navigate = useNavigate();
  const saved = isFavorite(concert.id);
  const isMuseum = concert.category === "museums_exhibits";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sunset/30 hover:shadow-lg hover:shadow-sunset/5">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className="border-transparent bg-amber/15 uppercase tracking-wider text-warm">
          {concert.genre}
        </Badge>
        <div className="flex items-center gap-2">
          {concert.trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunset/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-sunset">
              <Flame className="h-3.5 w-3.5" /> Trending
            </span>
          )}
          <button
            type="button"
            aria-label={saved ? "Remove from favorites" : "Save this show"}
            aria-pressed={saved}
            onClick={() =>
              canFavorite ? toggleFavorite(concert.id) : navigate({ to: "/auth" })
            }
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-accent"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
          </button>
        </div>
      </div>

      <h3 className="mt-4 text-3xl leading-none text-foreground">{concert.artist}</h3>
      {concert.support && !isMuseum && (
        <p className="mt-1 text-sm text-muted-foreground">with {concert.support}</p>
      )}
      {concert.support && isMuseum && (
        <p className="mt-1 text-sm text-muted-foreground">{concert.support}</p>
      )}

      <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>
            {formatDate(concert.date)} · {concert.time}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isMuseum ? (
            <Building2 className="h-4 w-4 text-primary" />
          ) : (
            <MapPin className="h-4 w-4 text-primary" />
          )}
          <span>
            {concert.venue}, {concert.city}
          </span>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-display text-2xl text-foreground">{concert.price}</p>
          <p className="text-xs text-muted-foreground">via {concert.source}</p>
        </div>
        <Button asChild size="sm" className="font-semibold uppercase tracking-wide">
          <a href={concert.ticketUrl} target="_blank" rel="noopener noreferrer">
            <Ticket className="mr-1 h-4 w-4" /> {isMuseum ? "Visit" : "Tickets"}
          </a>
        </Button>
      </div>
    </article>
  );
}
