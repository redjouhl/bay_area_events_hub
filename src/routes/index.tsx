import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, List, LocateFixed, Map as MapIcon, Search, TicketX } from "lucide-react";
import { CLASSICAL_TYPES, COMEDY_TYPES, GENRES, MUSEUM_TYPES, THEATER_TYPES, isFamilyFriendly, isFreeEvent, isSoldOut, mergeRecurringDates, parseMinPrice, concerts as seedConcerts } from "@/data/concerts";
import { getEvents } from "@/lib/events.functions";
import { getRegions } from "@/lib/regions.functions";
import { getVenueCoordinates } from "@/lib/venues.functions";
import { ConcertCard, ConcertCardSkeleton } from "@/components/ConcertCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pacificToday, weekRange, weekendRange, next7Range, next30Range } from "@/lib/date-ranges";

// Leaflet touches the DOM at import time, so it's loaded lazily and only
// ever rendered client-side (view starts as "list", so this never enters
// the tree during SSR).
const EventsMap = lazy(() => import("@/components/EventsMap").then((m) => ({ default: m.EventsMap })));

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const TITLE = "BEST HAPPENINGS IN THE BAY | Happenly";
const DESCRIPTION =
  "Concerts, museums, festivals, and more: all in one place. Discover the best Bay Area events.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type DateRange = "all" | "today" | "throughSunday" | "weekend" | "week" | "month";
type SortOption = "chronological" | "priceLowHigh" | "priceHighLow" | "distance";
type Category = "all" | "classical" | "comedy" | "concerts" | "family" | "free" | "museums_exhibits" | "other" | "theater";

const FALLBACK_REGIONS: Record<string, string[]> = {
  "East Bay": ["Oakland", "Berkeley", "Piedmont", "Walnut Creek", "Livermore", "Fremont", "Kensington", "Castro Valley", "Albany"],
  "South Bay & Peninsula": ["San Jose", "Mountain View", "Palo Alto", "Redwood City", "Stanford", "Burlingame", "San Mateo", "Daly City"],
  "North Bay": ["San Rafael", "Novato", "Santa Rosa", "Napa", "Vallejo", "Petaluma", "Sausalito", "Mill Valley", "San Anselmo", "Tiburon", "Larkspur", "Corte Madera", "Fairfax"],
};


function Index() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("All");
  const [genre, setGenre] = useState<string>("All");
  const [range, setRange] = useState<DateRange>("all");
  const [specificDate, setSpecificDate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("chronological");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [category, setCategory] = useState<Category>("concerts");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hideSoldOut, setHideSoldOut] = useState(false);

  const { data: liveEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: regionRows } = useQuery({
    queryKey: ["regions"],
    queryFn: () => getRegions(),
    staleTime: 60 * 60 * 1000,
  });
  const { data: venueCoords } = useQuery({
    queryKey: ["venue-coordinates"],
    queryFn: () => getVenueCoordinates(),
    staleTime: 60 * 60 * 1000,
    enabled: viewMode === "map" || sortBy === "distance",
  });
  const venueCoordByName = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    for (const v of venueCoords ?? []) m.set(v.name, { lat: v.lat, lng: v.lng });
    return m;
  }, [venueCoords]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location — check your browser's location permission.");
        setLocating(false);
      },
      { timeout: 10_000 },
    );
  }
  const REGIONS = useMemo(() => {
    if (!regionRows?.length) return FALLBACK_REGIONS;
    return Object.fromEntries(regionRows.map((r) => [r.name, r.cities]));
  }, [regionRows]);
  const regionNames = useMemo(() => Object.keys(REGIONS), [REGIONS]);
  const rawConcerts = eventsLoading ? [] : liveEvents?.length ? liveEvents : seedConcerts;
  const concerts = useMemo(() => mergeRecurringDates(rawConcerts), [rawConcerts]);

  const todayPT = useMemo(() => pacificToday(), []);
  const { start: wkStart, end: wkEnd } = useMemo(() => weekendRange(todayPT), [todayPT]);
  const { start: weekStart, end: weekEnd } = useMemo(() => weekRange(todayPT), [todayPT]);
  const { start: n7Start, end: n7End } = useMemo(() => next7Range(todayPT), [todayPT]);
  const { start: n30Start, end: n30End } = useMemo(() => next30Range(todayPT), [todayPT]);

  const events = useMemo(() => {
    if (category === "all") return concerts;
    if (category === "free") return concerts.filter(isFreeEvent);
    if (category === "family") return concerts.filter(isFamilyFriendly);
    return concerts.filter((c) => c.category === category);
  }, [concerts, category]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const regionCities = REGIONS[city];
    return events
      .filter((c) => {
        if (city !== "All") {
          if (regionCities ? !regionCities.includes(c.city) : c.city !== city) return false;
        }
        if (genre !== "All" && c.genre !== genre) return false;
        if (hideSoldOut && isSoldOut(c)) return false;
        if (q) {
          const hay = `${c.artist} ${c.support ?? ""} ${c.venue} ${c.city} ${c.genre}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        const eventDates = c.dates?.length ? c.dates : [c.date];
        if (specificDate) return eventDates.includes(specificDate);
        if (range === "today") return eventDates.includes(todayPT);
        if (range === "throughSunday") return eventDates.some((d) => d >= weekStart && d <= weekEnd);
        if (range === "weekend") return eventDates.some((d) => d >= wkStart && d <= wkEnd);
        if (range === "week") return eventDates.some((d) => d >= n7Start && d <= n7End);
        if (range === "month") return eventDates.some((d) => d >= n30Start && d <= n30End);
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priceLowHigh" || sortBy === "priceHighLow") {
          const pa = parseMinPrice(a);
          const pb = parseMinPrice(b);
          if (pa === null && pb === null) return a.date.localeCompare(b.date);
          if (pa === null) return 1;
          if (pb === null) return -1;
          return sortBy === "priceLowHigh" ? pa - pb : pb - pa;
        }
        if (sortBy === "distance" && userLocation) {
          const ca = venueCoordByName.get(a.venue);
          const cb = venueCoordByName.get(b.venue);
          const da = ca ? haversineMiles(userLocation, ca) : null;
          const db = cb ? haversineMiles(userLocation, cb) : null;
          if (da === null && db === null) return a.date.localeCompare(b.date);
          if (da === null) return 1;
          if (db === null) return -1;
          return da - db;
        }
        return a.date.localeCompare(b.date);
      });
  }, [
    events,
    REGIONS,
    query,
    city,
    genre,
    hideSoldOut,
    sortBy,
    range,
    specificDate,
    todayPT,
    wkStart,
    wkEnd,
    weekStart,
    weekEnd,
    n7Start,
    n7End,
    n30Start,
    n30End,
    userLocation,
    venueCoordByName,
  ]);

  const trending = useMemo(() => {
    const upcoming = events
      .filter((c) => (c.dates?.length ? c.dates : [c.date]).some((d) => d >= todayPT))
      .sort((a, b) => a.date.localeCompare(b.date));
    const flagged = upcoming.filter((c) => c.trending);
    return (flagged.length ? flagged : upcoming).slice(0, 10);
  }, [events, todayPT]);

  // Each filter row keeps its own color, but all three now share a clear
  // pill/button shape (border + fill) so every option reads as tappable
  // rather than blending into plain text.
  const dateChip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-transparent bg-amber text-foreground"
        : "border-border bg-secondary text-secondary-foreground hover:border-amber/50"
    }`;

  const cityChip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-transparent bg-rose text-white"
        : "border-border bg-secondary text-secondary-foreground hover:border-rose/50"
    }`;

  const genreChip = (active: boolean) =>
    `border-b-2 px-0.5 pb-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
      active
        ? "border-sunset text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-sunset/40"
    }`;

  const categoryPill = (value: Category, label: string) => (
    <button
      key={value}
      onClick={() => {
        setCategory(value);
        setGenre("All");
        setQuery("");
      }}
      className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-bold transition-all active:scale-95 ${
        category === value
          ? "pill-active border-transparent"
          : "pill-inactive"
      }`}
    >
      {label}
    </button>
  );

  const isMuseum = category === "museums_exhibits";
  const isClassical = category === "classical";
  const isComedy = category === "comedy";
  const isTheater = category === "theater";
  const isAll = category === "all";
  const isFreeCategory = category === "free";
  const isOtherCategory = category === "other";
  const isFamilyCategory = category === "family";
  const genreOptions = isMuseum
    ? MUSEUM_TYPES
    : isClassical
      ? CLASSICAL_TYPES
      : isComedy
        ? COMEDY_TYPES
        : isTheater
          ? THEATER_TYPES
          : isOtherCategory || isFamilyCategory
            ? []
            : GENRES;

  return (
    <div className="relative min-h-screen bg-background">
      {/* subtle warm background blobs */}
      <div className="pointer-events-none fixed -left-32 top-0 h-96 w-96 rounded-full bg-amber/10 blur-[100px]" />
      <div className="pointer-events-none fixed -right-32 bottom-20 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative bg-background">
        <SiteHeader />
      </div>

      <div className="sticky top-0 z-20 border-y border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl snap-x flex-nowrap items-center gap-2 overflow-x-auto px-4 py-3">
          {categoryPill("all", "All Categories")}
          {categoryPill("concerts", "Concerts & DJs")}
          {categoryPill("comedy", "Comedy")}
          {categoryPill("theater", "Theater")}
          {categoryPill("classical", "Classical / Symphony")}
          {categoryPill("museums_exhibits", "Museums & Exhibits")}
          {categoryPill("free", "Free Events")}
          {categoryPill("family", "Family Friendly")}
          {categoryPill("other", "Other")}
        </div>
      </div>

      <header className="relative border-b border-border bg-background">
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6">
          <h1 className="max-w-4xl text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
            <span className="gradient-text">BEST HAPPENINGS IN THE BAY</span>
          </h1>
          <p className="mt-3 font-semibold uppercase tracking-[0.2em] text-tan">Bay Area · Events & Culture</p>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Expand your horizon. Discover what's happening around the Bay.
          </p>

          <div className="group relative mt-6 max-w-xl">
            <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-amber-200 to-rose-200 opacity-25 blur-md transition duration-300 group-focus-within:opacity-60" />
            <div className="relative flex items-center gap-2 rounded-[20px] border border-border bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl transition focus-within:search-glow">
              <Search className="h-5 w-5 shrink-0 text-tan" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isMuseum
                    ? "Search exhibitions, museums, cities…"
                    : isClassical
                      ? "Search programs, composers, halls…"
                      : isComedy
                        ? "Search comedians, clubs, cities…"
                        : isTheater
                          ? "Search shows, playwrights, theaters…"
                          : isAll || isFreeCategory || isOtherCategory || isFamilyCategory
                            ? "Search events, venues, cities…"
                            : "Search artists, venues, cities…"
                }
                aria-label={
                  isMuseum
                    ? "Search exhibits"
                    : isClassical
                      ? "Search performances"
                      : isComedy
                        ? "Search comedy shows"
                        : isTheater
                          ? "Search theater shows"
                          : isAll || isFreeCategory || isOtherCategory || isFamilyCategory
                            ? "Search events"
                            : "Search concerts"
                }
                className="border-0 bg-transparent text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
          </div>

          {query.trim() && (
            <div className="mt-8">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {results.length} {results.length === 1 ? (isMuseum ? "match" : "show") : isMuseum ? "matches" : "shows"}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((c) => (
                  <ConcertCard key={c.id} concert={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        {!query.trim() && (
          <section aria-labelledby="trending">
            <h2 id="trending" className="text-3xl">
              Our team's recommendations
            </h2>
            <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
              {eventsLoading
                ? Array.from({ length: 5 }).map((_, i) => <ConcertCardSkeleton key={i} compact />)
                : trending.map((c) => <ConcertCard key={c.id} concert={c} compact />)}
            </div>
          </section>
        )}

        <section aria-labelledby="all-shows" className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <aside className="md:sticky md:top-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Regions</h3>
            <div className="mt-3 flex flex-wrap gap-2 md:flex-col md:items-start">
              <button onClick={() => setCity("All")} className={cityChip(city === "All")}>
                All regions
              </button>
              {regionNames.map((name) => (
                <button key={name} onClick={() => setCity(name)} className={cityChip(city === name)}>
                  {name}
                </button>
              ))}
            </div>
          </aside>

          <div>
            <h2 id="all-shows" className="text-3xl">
              {isMuseum
                ? "All exhibits"
                : isClassical
                  ? "All performances"
                  : isComedy
                    ? "All comedy shows"
                    : isTheater
                      ? "All theater shows"
                      : isAll
                        ? "All events"
                        : isFreeCategory
                          ? "Free events"
                          : isOtherCategory
                            ? "Other events"
                            : isFamilyCategory
                              ? "Family-friendly events"
                              : "All concerts & DJs"}
            </h2>

            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Any date"],
                    ["today", "Today"],
                    ["throughSunday", "This week"],
                    ["weekend", "This weekend"],
                    ["week", "Next 7 days"],
                    ["month", "Next 30 days"],
                  ] as [DateRange, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setRange(value);
                      setSpecificDate(null);
                    }}
                    className={dateChip(range === value && !specificDate)}
                  >
                    {label}
                  </button>
                ))}

                <div className="mx-1 h-6 w-px self-center bg-border" aria-hidden="true" />

                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        specificDate
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-dashed border-tan/50 bg-transparent text-tan hover:border-tan hover:text-foreground"
                      }`}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {specificDate
                        ? new Date(`${specificDate}T12:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={specificDate ? new Date(`${specificDate}T12:00:00`) : undefined}
                      {...(specificDate ? { defaultMonth: new Date(`${specificDate}T12:00:00`) } : {})}
                      onSelect={(d) => {
                        if (!d) return;
                        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        setSpecificDate(iso);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!isOtherCategory && !isFamilyCategory && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  <button onClick={() => setGenre("All")} className={genreChip(genre === "All")}>
                    {isMuseum ? "All exhibit types" : isClassical || isComedy || isTheater ? "All types" : "All genres"}
                  </button>
                  {genreOptions.map((g) => (
                    <button key={g} onClick={() => setGenre(g)} className={genreChip(genre === g)}>
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!eventsLoading && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                  {results.length} {results.length === 1 ? (isMuseum ? "exhibit" : "show") : isMuseum ? "exhibits" : "shows"}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={hideSoldOut ? "default" : "secondary"}
                    size="sm"
                    className="h-9 gap-1.5 text-sm"
                    onClick={() => setHideSoldOut((v) => !v)}
                    aria-pressed={hideSoldOut}
                  >
                    <TicketX className="h-4 w-4" />
                    Hide sold out
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 gap-1.5 text-sm"
                    onClick={useMyLocation}
                    disabled={locating}
                  >
                    <LocateFixed className="h-4 w-4" />
                    {locating ? "Locating…" : userLocation ? "Location set" : "Use my location"}
                  </Button>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => {
                      setSortBy(v as SortOption);
                      if (v === "distance" && !userLocation) useMyLocation();
                    }}
                  >
                    <SelectTrigger className="h-9 w-[190px] text-sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chronological">Date: Soonest first</SelectItem>
                      <SelectItem value="priceLowHigh">Price: Low to high</SelectItem>
                      <SelectItem value="priceHighLow">Price: High to low</SelectItem>
                      <SelectItem value="distance">Distance: Nearest first</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center rounded-full border border-border p-0.5">
                    <button
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="h-4 w-4" /> List
                    </button>
                    <button
                      onClick={() => setViewMode("map")}
                      aria-label="Map view"
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MapIcon className="h-4 w-4" /> Map
                    </button>
                  </div>
                </div>
              </div>
            )}

            {locationError && <p className="mt-2 text-sm text-destructive">{locationError}</p>}

            {!eventsLoading && viewMode === "map" ? (
              <div className="mt-6">
                <Suspense
                  fallback={
                    <div className="flex h-[600px] w-full items-center justify-center rounded-2xl border border-border text-muted-foreground">
                      Loading map…
                    </div>
                  }
                >
                  <EventsMap events={results} venueCoords={venueCoords ?? []} userLocation={userLocation} />
                </Suspense>
              </div>
            ) : eventsLoading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ConcertCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  {isMuseum ? "No exhibits match those filters." : "No shows match those filters."}
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setCity("All");
                    setGenre("All");
                    setRange("all");
                    setSpecificDate(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((c) => (
                  <ConcertCard key={c.id} concert={c} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
          <p>
            Don’t see your event or venue?{" "}
            <a href="mailto:info@happenly.app" className="text-primary underline decoration-primary/50 underline-offset-4 hover:text-primary/90">
              Holler at us at info@happenly.app
            </a>
            {". We’d love to add it!"}
          </p>
        </div>
      </footer>
    </div>
  );
}
