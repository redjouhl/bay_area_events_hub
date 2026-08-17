import { useState, type SVGProps } from "react";
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

function SpotifyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function spotifySearchUrl(query: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] : words[0]?.[1];
  return `${first}${last ?? ""}`.toUpperCase();
}

export function ConcertCard({ concert }: { concert: Concert }) {
  const { isFavorite, toggleFavorite, canFavorite } = useFavorites();
  const navigate = useNavigate();
  const saved = isFavorite(concert.id);
  const isMuseum = concert.category === "museums_exhibits";
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = concert.imageUrl && !imageFailed;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sunset/30 hover:shadow-lg hover:shadow-sunset/5">
      <div className="-mx-5 -mt-5 mb-4 aspect-[16/9] overflow-hidden">
        {showImage ? (
          <img
            src={concert.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="gradient-surface flex h-full w-full items-center justify-center text-3xl font-semibold text-white/90">
            {initials(concert.artist)}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className="border-transparent bg-sunset/15 uppercase tracking-wider text-sunset">
          {concert.genre}
        </Badge>
        <div className="flex items-center gap-2">
          {concert.trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunset/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-sunset">
              <Flame className="h-3.5 w-3.5" /> Trending
            </span>
          )}
          {!isMuseum && (
            <a
              href={spotifySearchUrl(concert.artist)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Search ${concert.artist} on Spotify`}
              className="rounded-full p-1.5 text-[#1DB954] transition-colors hover:bg-secondary hover:text-[#169c46]"
            >
              <SpotifyIcon className="h-4 w-4" />
            </a>
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
