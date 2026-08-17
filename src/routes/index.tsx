import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { CLASSICAL_TYPES, COMEDY_TYPES, GENRES, MUSEUM_TYPES, concerts as seedConcerts } from "@/data/concerts";
import { getEvents } from "@/lib/events.functions";
import { getRegions } from "@/lib/regions.functions";
import { ConcertCard } from "@/components/ConcertCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pacificToday, weekRange, weekendRange, next7Range, next30Range } from "@/lib/date-ranges";

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
type Category = "classical" | "comedy" | "concerts" | "museums_exhibits";

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
  const [category, setCategory] = useState<Category>("concerts");

  const { data: liveEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: regionRows } = useQuery({
    queryKey: ["regions"],
    queryFn: () => getRegions(),
    staleTime: 60 * 60 * 1000,
  });
  const REGIONS = useMemo(() => {
    if (!regionRows?.length) return FALLBACK_REGIONS;
    return Object.fromEntries(regionRows.map((r) => [r.name, r.cities]));
  }, [regionRows]);
  const regionNames = useMemo(() => Object.keys(REGIONS), [REGIONS]);
  const concerts = liveEvents?.length ? liveEvents : seedConcerts;

  const todayPT = useMemo(() => pacificToday(), []);
  const { start: wkStart, end: wkEnd } = useMemo(() => weekendRange(todayPT), [todayPT]);
  const { start: weekStart, end: weekEnd } = useMemo(() => weekRange(todayPT), [todayPT]);
  const { start: n7Start, end: n7End } = useMemo(() => next7Range(todayPT), [todayPT]);
  const { start: n30Start, end: n30End } = useMemo(() => next30Range(todayPT), [todayPT]);

  const events = useMemo(
    () => concerts.filter((c) => c.category === category),
    [concerts, category],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const regionCities = REGIONS[city];
    return events
      .filter((c) => {
        if (city !== "All") {
          if (regionCities ? !regionCities.includes(c.city) : c.city !== city) return false;
        }
        if (genre !== "All" && c.genre !== genre) return false;
        if (q) {
          const hay = `${c.artist} ${c.support ?? ""} ${c.venue} ${c.city} ${c.genre}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (range === "today") return c.date === todayPT;
        if (range === "throughSunday") return c.date >= weekStart && c.date <= weekEnd;
        if (range === "weekend") return c.date >= wkStart && c.date <= wkEnd;
        if (range === "week") return c.date >= n7Start && c.date <= n7End;
        if (range === "month") return c.date >= n30Start && c.date <= n30End;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, REGIONS, query, city, genre, range, todayPT, wkStart, wkEnd, weekStart, weekEnd, n7Start, n7End, n30Start, n30End]);

  const trending = useMemo(() => {
    const upcoming = events.filter((c) => c.date >= todayPT);
    const flagged = upcoming.filter((c) => c.trending);
    return (flagged.length ? flagged : upcoming).slice(0, 3);
  }, [events, todayPT]);

  const CHIP_TONES = {
    amber: { active: "border-transparent bg-amber text-white", hover: "hover:border-amber/50" },
    accent: { active: "border-transparent bg-accent text-accent-foreground", hover: "hover:border-accent/50" },
    sunset: { active: "border-transparent bg-sunset text-white", hover: "hover:border-sunset/50" },
  } as const;

  const chip = (active: boolean, tone: keyof typeof CHIP_TONES = "sunset") => {
    const t = CHIP_TONES[tone];
    return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? t.active : `border-border bg-secondary text-secondary-foreground ${t.hover}`
    }`;
  };

  const categoryPill = (value: Category, label: string) => (
    <button
      key={value}
      onClick={() => {
        setCategory(value);
        setGenre("All");
        setQuery("");
      }}
      className={`rounded-full border px-5 py-2 text-sm font-bold transition-all active:scale-95 ${
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
  const genreOptions = isMuseum
    ? MUSEUM_TYPES
    : isClassical
      ? CLASSICAL_TYPES
      : isComedy
        ? COMEDY_TYPES
        : GENRES;

  return (
    <div className="relative min-h-screen bg-background">
      {/* subtle warm background blobs */}
      <div className="pointer-events-none fixed -left-32 top-0 h-96 w-96 rounded-full bg-orange-200/20 blur-[100px]" />
      <div className="pointer-events-none fixed -right-32 bottom-20 h-96 w-96 rounded-full bg-rose-200/15 blur-[100px]" />

      <header className="relative border-b border-border bg-background">
        <SiteHeader />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-tan">
            Bay Area - Events & Culture
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            <span className="gradient-text">BEST HAPPENINGS IN THE BAY</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Your next night out, sorted.
          </p>

          <div className="group relative mt-8 max-w-xl">
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
                        : "Search artists, venues, cities…"
                }
                aria-label={
                  isMuseum
                    ? "Search exhibits"
                    : isClassical
                      ? "Search performances"
                      : isComedy
                        ? "Search comedy shows"
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

      <main className="mx-auto max-w-6xl px-6 py-12">
        {!query.trim() && (
          <section aria-labelledby="trending">
            <h2 id="trending" className="text-3xl">
              Trending this weekend
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((c) => (
                <ConcertCard key={c.id} concert={c} />
              ))}
            </div>
          </section>
        )}

        <h2 className="mt-16 text-3xl">Browse by category</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {categoryPill("classical", "Classical / Symphony")}
          {categoryPill("comedy", "Comedy")}
          {categoryPill("concerts", "Concerts")}
          {categoryPill("museums_exhibits", "Museums & Exhibits")}
        </div>

        <section aria-labelledby="all-shows" className="mt-16">
          <h2 id="all-shows" className="text-3xl">
            {isMuseum
              ? "All exhibits"
              : isClassical
                ? "All performances"
                : isComedy
                  ? "All comedy shows"
                  : "All concerts"}
          </h2>

          <div className="mt-5 space-y-4">
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
                  onClick={() => setRange(value)}
                  className={chip(range === value, "amber")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCity("All")} className={chip(city === "All", "accent")}>
                All cities
              </button>
              {regionNames.map((name) => (
                <button key={name} onClick={() => setCity(name)} className={chip(city === name, "accent")}>
                  {name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setGenre("All")} className={chip(genre === "All", "sunset")}>
                {isMuseum ? "All exhibit types" : isClassical || isComedy ? "All types" : "All genres"}
              </button>
              {genreOptions.map((g) => (
                <button key={g} onClick={() => setGenre(g)} className={chip(genre === g, "sunset")}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
            {results.length} {results.length === 1 ? (isMuseum ? "exhibit" : "show") : isMuseum ? "exhibits" : "shows"}
          </p>

          {results.length === 0 ? (
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
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
          <p>
            Happenly · Bay Area concerts and museum exhibits refreshed automatically from venue calendars. Tickets are sold by the linked venues and
            ticketing partners.
          </p>
          <p className="mt-3">
            Don’t see your event or venue?{" "}
            <a href="mailto:info@happenly.app" className="text-primary underline decoration-primary/50 underline-offset-4 hover:text-primary/90">
              Holler at us at info@happenly.app
            </a>{" "}
            — we’d love to add it!
          </p>
        </div>
      </footer>
    </div>
  );
}
