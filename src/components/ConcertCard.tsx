import { useState, type SVGProps } from "react";
import { CalendarDays, MapPin, Ticket, Flame, Heart, Building2, Share2, Mail, MessageCircle, Copy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { isFreeEvent, isSoldOut, type Concert } from "@/data/concerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useFavorites } from "@/hooks/useFavorites";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatDateLabel(dates: string[]) {
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

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export function eventPageUrl(concert: Pick<Concert, "id">) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/events/${concert.id}`;
}

// Builds the shareable channel links for one event. mailto:/sms:/wa.me all
// take plain query params, so the same summary text is reused across each.
// The link points back to the event's page on Outsy (not the external
// ticket link) so the person you share with lands on our site first.
function shareLinks(concert: Concert) {
  const dateLabel = formatDateLabel(concert.dates?.length ? concert.dates : [concert.date]);
  const summary = `${concert.artist} at ${concert.venue}, ${concert.city} on ${dateLabel}`;
  const combined = `${summary}\n${eventPageUrl(concert)}`;
  return {
    combined,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(combined)}`,
    sms: `sms:?&body=${encodeURIComponent(combined)}`,
    email: `mailto:?subject=${encodeURIComponent(concert.artist)}&body=${encodeURIComponent(combined)}`,
  };
}

async function copyShareLink(concert: Concert) {
  try {
    await navigator.clipboard.writeText(eventPageUrl(concert));
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Couldn't copy link");
  }
}

// Instagram doesn't offer a web link that pre-fills a post/Story/DM (unlike
// WhatsApp's wa.me), so the best we can do is copy the details and hand the
// user off to Instagram to paste them in.
async function shareToInstagram(concert: Concert) {
  try {
    await navigator.clipboard.writeText(shareLinks(concert).combined);
    toast.success("Link copied — paste it into your Instagram post, Story, or DM");
  } catch {
    toast.error("Couldn't copy link");
  }
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] : words[0]?.[1];
  return `${first}${last ?? ""}`.toUpperCase();
}

function ShareMenuItems({ concert }: { concert: Concert }) {
  const links = shareLinks(concert);
  return (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem asChild>
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> WhatsApp
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={links.sms}>
          <MessageCircle className="h-4 w-4" /> Message
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={links.email}>
          <Mail className="h-4 w-4" /> Email
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => shareToInstagram(concert)}>
        <InstagramIcon className="h-4 w-4 text-[#E1306C]" /> Instagram
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => copyShareLink(concert)}>
        <Copy className="h-4 w-4" /> Copy link
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function ShareButton({ concert, compact = false }: { concert: Concert; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Share this show"
          className={
            compact
              ? "rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              : "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-accent"
          }
        >
          <Share2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </DropdownMenuTrigger>
      <ShareMenuItems concert={concert} />
    </DropdownMenu>
  );
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
  const showYouTube = concert.category === "comedy";
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
          <div className="flex items-center gap-1">
            <ShareButton concert={concert} compact />
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
          {showYouTube && (
            <a
              href={youtubeSearchUrl(concert.artist)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Search ${concert.artist} on YouTube`}
              className="rounded-full p-1.5 text-[#FF0000] transition-colors hover:bg-secondary hover:text-[#cc0000]"
            >
              <YouTubeIcon className="h-5 w-5" />
            </a>
          )}
          <ShareButton concert={concert} />
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
