import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Download, Pencil } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  amIAdmin,
  listVenues,
  saveVenue,
  deleteVenue,
  importVenues,
  listUpcomingEvents,
  setEventTrending,
  type AdminVenue,
  type AdminEvent,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Venue admin · Happenly" },
      { name: "description", content: "Add, edit and bulk-import the venues Happenly scrapes for Bay Area events." },
      { property: "og:title", content: "Venue admin · Happenly" },
      { property: "og:description", content: "Manage the venue catalog powering Happenly's event listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CATEGORIES = ["classical", "comedy", "concerts", "museums_exhibits"] as const;

type Draft = {
  id?: string;
  name: string;
  city: string;
  category: string;
  source_url: string;
  source_name: string;
  prompt_hint: string;
  active: boolean;
};

const emptyDraft: Draft = {
  name: "",
  city: "",
  category: "concerts",
  source_url: "",
  source_name: "",
  prompt_hint: "",
  active: true,
};

/** Minimal CSV parser handling quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function AdminPage() {
  const qc = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const fetchVenues = useServerFn(listVenues);
  const save = useServerFn(saveVenue);
  const remove = useServerFn(deleteVenue);
  const bulkImport = useServerFn(importVenues);
  const fetchEvents = useServerFn(listUpcomingEvents);
  const toggleTrending = useServerFn(setEventTrending);

  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const [view, setView] = useState<"venues" | "trending">("venues");
  const venues = useQuery({
    queryKey: ["admin-venues"],
    queryFn: () => fetchVenues(),
    enabled: admin.data === true,
  });
  const events = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => fetchEvents(),
    enabled: admin.data === true && view === "trending",
  });

  const [search, setSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const trendingMut = useMutation({
    mutationFn: (v: { id: string; trending: boolean }) => toggleTrending({ data: v }),
    onMutate: async ({ id, trending }) => {
      await qc.cancelQueries({ queryKey: ["admin-events"] });
      const prev = qc.getQueryData<AdminEvent[]>(["admin-events"]);
      qc.setQueryData<AdminEvent[]>(["admin-events"], (old) =>
        old?.map((e) => (e.id === id ? { ...e, trending } : e)),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-events"], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const eventRows = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    const list = events.data ?? [];
    if (!q) return list;
    return list.filter((e) => [e.artist, e.venue, e.city, e.category].some((f) => f.toLowerCase().includes(q)));
  }, [events.data, eventSearch]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-venues"] });

  const saveMut = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          ...(d.id ? { id: d.id } : {}),
          name: d.name.trim(),
          city: d.city.trim(),
          category: d.category,
          source_url: d.source_url.trim(),
          source_name: d.source_name.trim() || "Venue site",
          prompt_hint: d.prompt_hint.trim() || null,
          active: d.active,
        },
      }),
    onSuccess: () => { setDraft(null); invalidate(); toast.success("Venue saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Venue deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: (rows: Draft[]) =>
      bulkImport({
        data: {
          rows: rows.map((r) => ({
            name: r.name,
            city: r.city,
            category: r.category,
            source_url: r.source_url,
            source_name: r.source_name,
            prompt_hint: r.prompt_hint || null,
            active: r.active,
          })),
        },
      }),
    onSuccess: (res) => { invalidate(); toast.success(`Imported ${res.inserted} venues`); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = venues.data ?? [];
    if (!q) return list;
    return list.filter((v) =>
      [v.name, v.city, v.category, v.source_name].some((f) => f.toLowerCase().includes(q)),
    );
  }, [venues.data, search]);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const table = parseCsv(String(reader.result));
      if (table.length < 2) { toast.error("CSV looks empty"); return; }
      const header = table[0]!.map((h) => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      const need = ["name", "city", "source_url"];
      const missing = need.filter((k) => idx(k) === -1);
      if (missing.length) { toast.error(`Missing column(s): ${missing.join(", ")}`); return; }
      const parsed: Draft[] = table.slice(1).map((r) => ({
        name: (r[idx("name")] ?? "").trim(),
        city: (r[idx("city")] ?? "").trim(),
        category: (idx("category") > -1 ? r[idx("category")] : "")?.trim() || "concerts",
        source_url: (r[idx("source_url")] ?? "").trim(),
        source_name: (idx("source_name") > -1 ? r[idx("source_name")] : "")?.trim() || "Venue site",
        prompt_hint: (idx("prompt_hint") > -1 ? r[idx("prompt_hint")] : "")?.trim() || "",
        active: (idx("active") > -1 ? r[idx("active")] : "")?.trim().toLowerCase() !== "f",
      })).filter((r) => r.name && r.city && /^https?:\/\//.test(r.source_url));
      if (!parsed.length) { toast.error("No valid rows found"); return; }
      importMut.mutate(parsed);
    };
    reader.readAsText(file);
  }

  function exportCsv() {
    const list = venues.data ?? [];
    const head = ["name", "city", "category", "source_url", "source_name", "prompt_hint", "active"];
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = [head.join(",")]
      .concat(list.map((v) => head.map((h) => esc(String((v as unknown as Record<string, unknown>)[h] ?? ""))).join(",")))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "happenly-venues.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (admin.isLoading) {
    return <Shell><p className="text-muted-foreground">Checking access…</p></Shell>;
  }
  if (!admin.data) {
    return (
      <Shell>
        <h1 className="text-display text-3xl">Admins only</h1>
        <p className="mt-2 text-muted-foreground">This account doesn’t have admin access.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl tracking-wide">{view === "venues" ? "Venue admin" : "Trending events"}</h1>
          <p className="text-sm text-muted-foreground">
            {view === "venues"
              ? `${venues.data?.length ?? 0} venues in the catalog. Changes take effect on the next scrape.`
              : `Pick which upcoming shows appear in "Trending this weekend" on the homepage.`}
          </p>
        </div>
        {view === "venues" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
              <Plus className="mr-1 h-4 w-4" /> Add venue
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-1 h-4 w-4" /> Import CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
                />
              </label>
            </Button>
            <Button size="sm" variant="secondary" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setView("venues")}
          className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === "venues" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Venues
        </button>
        <button
          onClick={() => setView("trending")}
          className={`border-b-2 px-1 pb-2 text-sm font-semibold ${view === "trending" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Trending
        </button>
      </div>

      {view === "venues" && (
        <>
          <Input
            placeholder="Search venues, cities, sources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-6 max-w-md"
          />

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Last scraped</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((v: AdminVenue) => (
                  <tr key={v.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">
                      {v.name}
                      {!v.active && <Badge variant="secondary" className="ml-2">paused</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.city}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.category}</td>
                    <td className="px-4 py-3">
                      <a href={v.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {v.source_name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.last_scraped_at ? new Date(v.last_scraped_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDraft({
                              id: v.id,
                              name: v.name,
                              city: v.city,
                              category: v.category,
                              source_url: v.source_url,
                              source_name: v.source_name,
                              prompt_hint: v.prompt_hint ?? "",
                              active: v.active,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (confirm(`Delete ${v.name}?`)) deleteMut.mutate(v.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No venues match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "trending" && (
        <>
          <Input
            placeholder="Search upcoming events by artist, venue, city…"
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            className="mt-6 max-w-md"
          />

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Artist / show</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Trending</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.map((e: AdminEvent) => (
                  <tr key={e.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{e.artist}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.venue}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.city}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(`${e.date}T12:00:00`).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.category}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={e.trending}
                        onCheckedChange={(v) => trendingMut.mutate({ id: e.id, trending: v })}
                      />
                    </td>
                  </tr>
                ))}
                {!eventRows.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {events.isLoading ? "Loading events…" : "No upcoming events match."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Edit venue" : "Add venue"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="City"><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
              <Field label="Category">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Source URL"><Input value={draft.source_url} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} /></Field>
              <Field label="Source name"><Input value={draft.source_name} onChange={(e) => setDraft({ ...draft, source_name: e.target.value })} /></Field>
              <Field label="Scrape hint (optional)"><Input value={draft.prompt_hint} onChange={(e) => setDraft({ ...draft, prompt_hint: e.target.value })} /></Field>
              <div className="flex items-center gap-3">
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
                <Label>Active (included in scrapes)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button disabled={saveMut.isPending} onClick={() => draft && saveMut.mutate(draft)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-20">{children}</main>
    </div>
  );
}