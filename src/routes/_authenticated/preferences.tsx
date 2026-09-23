import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GENRES } from "@/data/concerts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EMPTY_PREFS, type Preferences } from "@/lib/preferences";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const TITLE = "Your Concert Preferences | Happenly";
const DESCRIPTION =
  "Pick the genres, cities and price range you care about so Happenly can surface the Bay Area shows that fit you.";

export const Route = createFileRoute("/_authenticated/preferences")({
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
  component: PreferencesPage,
});

const CITY_OPTIONS = ["San Francisco", "East Bay", "South Bay", "Santa Cruz"];

function chip(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
  }`;
}

function PreferencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFS);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
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

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  function toggleIn(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...prefs }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["preferences", user.id] });
    toast.success("Preferences saved");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <SiteHeader />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-5xl leading-none">
          <span className="gradient-text">Your preferences</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          We use these to build your “For you” feed of Bay Area shows.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setPrefs({ ...prefs, genres: toggleIn(prefs.genres, g) })}
                className={chip(prefs.genres.includes(g))}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl">Areas</h2>
          <div className="flex flex-wrap gap-2">
            {CITY_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setPrefs({ ...prefs, cities: toggleIn(prefs.cities, c) })}
                className={chip(prefs.cities.includes(c))}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl">Max ticket price</h2>
          <div className="flex max-w-xs items-center gap-3">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              value={prefs.max_price ?? ""}
              placeholder="No limit"
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  max_price: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>
        </section>

        <section className="mt-10 flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div>
            <Label htmlFor="alerts" className="text-base">
              Weekly email alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Get a digest of matching shows. (Sending starts once alerts are switched on.)
            </p>
          </div>
          <Switch
            id="alerts"
            checked={prefs.email_alerts}
            onCheckedChange={(v) => setPrefs({ ...prefs, email_alerts: v })}
          />
        </section>

        <Button
          onClick={save}
          disabled={saving}
          className="mt-8 font-semibold uppercase tracking-wide"
        >
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </main>
    </div>
  );
}
