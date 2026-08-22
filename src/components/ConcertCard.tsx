import { useState, type SVGProps } from "react";
import { CalendarDays, MapPin, Ticket, Flame, Heart, Building2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { isFreeEvent, isSoldOut, type Concert } from "@/data/concerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDateLabel(dates: string[]) {
  const sorted = [...dates].sort();
  if (sorted.length === 1) return formatDate(sorted[0]!);

  const isContiguous = sorted.every((d, i) => {
    if (i === 0) return true;
    const prev = new Date(`${sorted[i - 1]}T12:00:00`).getTime();
    const cur = new Date(`${d}T12:00:00`).getTime();
    return cur - prev === 86400000;
  });

  if (isContiguous) {
    const first = new Date(`${sorted[0]}T12:00:00`);
    const last = new Date(`${sorted[sorted.length - 1]}T12:00:00`);
    const firstLabel = first.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const lastLabel = last.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${firstLabel}–${lastLabel}`;
  }

  return sorted
    .map((d) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }))
    .join(", ");
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

export function ConcertCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="gradient-surface flex w-60 shrink-0 animate-pulse flex-col overflow-hidden rounded-xl p-3 opacity-60 sm:w-64">
        <div className="-mx-3 -mt-3 mb-3 aspect-[16/9] bg-black/10" />
        <div className="h-4 w-14 rounded-full bg-white/20" />
        <div className="mt-2 h-5 w-3/4 rounded bg-white/20" />
        <div className="mt-2 h-3 w-1/2 rounded bg-white/20" />
        <div className="mt-3 h-7 w-16 rounded-full bg-white/20" />
      </div>
    );
  }
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="-mx-5 -mt-5 mb-4 aspect-[16/9] bg-secondary" />
      <div className="h-5 w-16 rounded-full bg-secondary" />
      <div className="mt-4 h-7 w-3/4 rounded bg-secondary" />
      <div className="mt-3 h-4 w-1/2 rounded bg-secondary" />
      <div className="mt-2 h-4 w-2/3 rounded bg-secondary" />
      <div className="mt-5 h-9 w-24 rounded-full bg-secondary" />
    </div>
  );
}

export function ConcertCard({ concert, compact = false }: { concert: Concert; compact?: boolean }) {
  const { isFavorite, toggleFavorite, canFavorite } = useFavorites();
  const navigate = useNavigate();
  const saved = isFavorite(concert.id);
  const isMuseum = concert.category === "museums_exhibits";
  const isFree = isFreeEvent(concert);
  const soldOut = isSoldOut(concert);
  const showSpotify = concert.category === "concerts" || concert.category === "classical";
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = concert.imageUrl && !imageFailed;

  if (compact) {
    return (
      <article className="gradient-surface group relative flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-transparent p-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-64">
        {soldOut && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
            Sold Out
          </span>
        )}
        <div className="-mx-3 -mt-3 mb-3 aspect-[16/9] overflow-hidden">
          {showImage ? (
            <img
              src={concert.imageUrl}
              alt=""
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/10 text-xl font-semibold text-white/90">
              {initials(concert.artist)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="border-transparent bg-amber text-[10px] uppercase tracking-wider text-foreground shadow-sm">
            {concert.genre}
          </Badge>
          <button
            type="button"
            aria-label={saved ? "Remove from favorites" : "Save this show"}
            aria-pressed={saved}
            onClick={() => (canFavorite ? toggleFavorite(concert.id) : navigate({ to: "/auth" }))}
            className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <Heart className={`h-3.5 w-3.5 ${saved ? "fill-white text-white" : ""}`} />
          </button>
        </div>

        <h3 className="mt-2 line-clamp-1 text-lg leading-tight text-white">{concert.artist}</h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatDateLabel(concert.dates?.length ? concert.dates : [concert.date])} · {concert.time}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
          {isMuseum ? <Building2 className="h-3.5 w-3.5 shrink-0" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">
            {concert.venue}, {concert.city}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/20 pt-3">
          <p className="text-display truncate text-base text-white">{concert.price}</p>
          <Button
            asChild
            size="sm"
            className={`h-8 shrink-0 px-3 text-xs font-semibold uppercase tracking-wide ${
              soldOut
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-white text-foreground hover:bg-white/90"
            }`}
          >
            <a href={concert.ticketUrl} target="_blank" rel="noopener noreferrer">
              {soldOut ? "Sold Out" : isFree ? "Info" : isMuseum ? "Visit" : "Tickets"}
            </a>
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sunset/30 hover:shadow-lg hover:shadow-sunset/5">
      {soldOut && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
          Sold Out
        </span>
      )}
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
        <Badge variant="secondary" className="border-transparent bg-sunset uppercase tracking-wider text-white shadow-sm">
          {concert.genre}
        </Badge>
        <div className="flex items-center gap-2">
          {concert.trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunset/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-sunset">
              <Flame className="h-3.5 w-3.5" /> Trending
            </span>
          )}
          {showSpotify && (
            <a
              href={spotifySearchUrl(concert.artist)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Search ${concert.artist} on Spotify`}
              className="rounded-full p-1.5 text-[#1DB954] transition-colors hover:bg-secondary hover:text-[#169c46]"
            >
              <SpotifyIcon className="h-5 w-5" />
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
            {formatDateLabel(concert.dates?.length ? concert.dates : [concert.date])} · {concert.time}
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

      <div className="mt-auto flex flex-col items-start gap-3 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-display text-2xl text-foreground break-words">{concert.price}</p>
          <p className="text-xs text-muted-foreground">via {concert.source}</p>
        </div>
        <Button
          asChild
          size="sm"
          variant={soldOut ? "secondary" : "default"}
          className="font-semibold uppercase tracking-wide"
        >
          <a href={concert.ticketUrl} target="_blank" rel="noopener noreferrer">
            <Ticket className="mr-1 h-4 w-4" /> {soldOut ? "Sold Out" : isFree ? "Event Info" : isMuseum ? "Visit" : "Tickets"}
          </a>
        </Button>
      </div>
    </article>
  );
}
