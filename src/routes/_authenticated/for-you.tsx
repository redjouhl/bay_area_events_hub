import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/events.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { EMPTY_PREFS, hasPreferences, matchesPreferences, type Preferences } from "@/lib/preferences";
import { ConcertCard } from "@/components/ConcertCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const TITLE = "Your For You Concert Feed | Happenly";
const DESCRIPTION =
  "Bay Area shows picked for you based on your saved genres, areas and price range, plus every concert you've favorited.";

export const Route = createFileRoute("/_authenticated/for-you")({
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
  component: ForYouPage,
});

function pacificToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function ForYouPage() {
  const { user } = useAuth();
  const { favoriteIds } = useFavorites();

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: prefs = EMPTY_PREFS } = useQuery({
    queryKey: ["preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("genres, cities, venues, max_price, email_alerts")
        .maybeSingle();
      if (error) throw error;
      return (data as Preferences | null) ?? EMPTY_PREFS;
    },
  });

  const today = pacificToday();

  const matches = useMemo(
    () =>
      events
        .filter((c) => c.date >= today && matchesPreferences(c, prefs))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, prefs, today],
  );

  const saved = useMemo(
    () => events.filter((c) => favoriteIds.includes(c.id)).sort((a, b) => a.date.localeCompare(b.date)),
    [events, favoriteIds],
  );

  const tuned = hasPreferences(prefs);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-tan">For you</p>
          <h1 className="mt-4 text-6xl leading-[0.92]">
            <span className="gradient-text">Shows picked</span>
            <br />
            for your taste
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {tuned
              ? "Based on the genres, areas and price range you saved."
              : "Set your preferences and this feed fills up with the shows that fit."}
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/preferences">Edit preferences</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section aria-labelledby="matches">
          <h2 id="matches" className="text-3xl">
            {tuned ? "Matching your preferences" : "Upcoming shows"}
          </h2>
          <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
            {matches.length} {matches.length === 1 ? "show" : "shows"}
          </p>
          {matches.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Nothing matches yet — try widening your preferences.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.slice(0, 30).map((c) => (
                <ConcertCard key={c.id} concert={c} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="saved" className="mt-16">
          <h2 id="saved" className="text-3xl">
            Saved shows
          </h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              Tap the heart on any show to save it here.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((c) => (
                <ConcertCard key={c.id} concert={c} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
