import { VENUE_SOURCES, type VenueSource } from "@/data/venues";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

const ALLOWED_GENRES = [
  "Indie",
  "Rock",
  "Hip-Hop",
  "Electronic",
  "Jazz",
  "Metal",
  "Latin",
  "Punk",
  "Soul / R&B",
  "Children",
] as const;

const ALLOWED_MUSEUM_TYPES = [
  "Art",
  "History",
  "Science",
  "Photography",
  "Design",
  "Special Exhibition",
  "Film",
  "Interactive",
  "Family",
] as const;

const ALLOWED_CLASSICAL_TYPES = [
  "Symphony",
  "Opera",
  "Ballet",
  "Chamber Music",
  "Choral",
  "Organ / Sacred",
  "Recital",
  "Contemporary Classical",
  "Family Concert",
] as const;

type ScrapedEvent = {
  artist?: string;
  support?: string;
  date?: string;
  time?: string;
  genre?: string;
  price?: string;
  ticketUrl?: string;
  imageUrl?: string;
};

const SPORTS = /(soccer|football|basketball|hockey|baseball|wrestl|boxing|\bmma\b|\bufc\b|roller derby|rugby|lacrosse|\bvs\.?\b|oakland roots|golden state warriors|oakland ballers)/i;
const CHILDREN = /(story ?time|kids|children|family show|toddler|baby|preschool|puppet|sing[- ]?along for kids)/i;

function normalizeGenre(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  if (CHILDREN.test(text)) return "Children";
  const g = (raw ?? "").toLowerCase();
  if (g.includes("hip") || g.includes("rap")) return "Hip-Hop";
  if (g.includes("electro") || g.includes("dance") || g.includes("house") || g.includes("techno"))
    return "Electronic";
  if (g.includes("jazz")) return "Jazz";
  if (g.includes("metal")) return "Metal";
  if (g.includes("latin") || g.includes("salsa") || g.includes("cumbia")) return "Latin";
  if (g.includes("punk")) return "Punk";
  if (g.includes("soul") || g.includes("r&b") || g.includes("blues") || g.includes("funk"))
    return "Soul / R&B";
  if (g.includes("indie") || g.includes("folk") || g.includes("pop")) return "Indie";
  const exact = ALLOWED_GENRES.find((x) => x.toLowerCase() === g);
  return exact ?? "Rock";
}

function normalizeMuseumType(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  const lower = (raw ?? "").toLowerCase();
  if (/(science|space|nature|planetarium|climate|ocean|animal)/i.test(text)) return "Science";
  if (/(history|heritage|archives|culture|civilization)/i.test(text)) return "History";
  if (/(photograph|photo)/i.test(text)) return "Photography";
  if (/(design|fashion|architecture|craft)/i.test(text)) return "Design";
  if (/(film|cinema|video|screening)/i.test(text)) return "Film";
  if (/(interactive|digital|tech|immersive|experience)/i.test(text)) return "Interactive";
  if (/(family|kids|children)/i.test(text)) return "Family";
  if (/(special|temporary|featured|rotating|current)/i.test(text)) return "Special Exhibition";
  if (/(art|painting|sculpture|contemporary|modern|gallery)/i.test(text)) return "Art";
  const exact = ALLOWED_MUSEUM_TYPES.find((x) => x.toLowerCase() === lower);
  return exact ?? "Art";
}

const ALLOWED_COMEDY_TYPES = [
  "Stand-Up",
  "Improv",
  "Sketch",
  "Open Mic",
  "Showcase",
  "Storytelling",
  "Comedy Festival",
];

function normalizeComedyType(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  const lower = (raw ?? "").toLowerCase();
  if (/(improv|improvised)/i.test(text)) return "Improv";
  if (/(open mic|open-mic)/i.test(text)) return "Open Mic";
  if (/(sketch|variety show)/i.test(text)) return "Sketch";
  if (/(storytelling|true stories|moth)/i.test(text)) return "Storytelling";
  if (/(festival|fest\b)/i.test(text)) return "Comedy Festival";
  if (/(showcase|all[- ]stars|lineup|mixtape)/i.test(text)) return "Showcase";
  const exact = ALLOWED_COMEDY_TYPES.find((x) => x.toLowerCase() === lower);
  return exact ?? "Stand-Up";
}

function normalizeClassicalType(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  const lower = (raw ?? "").toLowerCase();
  if (/(opera|verdi|puccini|wagner|aida|tosca|carmen)/i.test(text)) return "Opera";
  if (/(ballet|nutcracker|swan lake|giselle|coppelia)/i.test(text)) return "Ballet";
  if (/(chamber|quartet|quintet|trio|ensemble)/i.test(text)) return "Chamber Music";
  if (/(choral|chorus|choir|requiem|mass in|cantata)/i.test(text)) return "Choral";
  if (/(organ|sacred|evensong|vespers|cathedral concert)/i.test(text)) return "Organ / Sacred";
  if (/(recital|solo piano|piano recital|violin recital)/i.test(text)) return "Recital";
  if (/(new music|premiere|contemporary|21st[- ]century)/i.test(text)) return "Contemporary Classical";
  if (/(family|kids|children)/i.test(text)) return "Family Concert";
  if (/(symphony|orchestra|philharmonic|concerto|symphonic)/i.test(text)) return "Symphony";
  const exact = ALLOWED_CLASSICAL_TYPES.find((x) => x.toLowerCase() === lower);
  return exact ?? "Symphony";
}

function isSportsEvent(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  if (SPORTS.test(text)) return true;
  const g = (raw ?? "").toLowerCase();
  return g.includes("sport");
}

const NON_EVENT = /(yoga|fitness class|parking|tour of|museum|open gym|private event|luxury suite|season ticket)/i;
const NON_MUSEUM = /(private event|rental|wedding|corporate|members-only|closed)/i;
const NON_CLASSICAL = /(private event|rental|wedding|corporate|parking|guided tour|worship service|sunday mass|yoga)/i;
const NON_COMEDY = /(private event|rental|corporate|parking|class\b|workshop)/i;

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function fingerprint(venue: string, date: string, artist: string, category: string) {
  return `${venue}|${date}|${artist}|${category}`.toLowerCase().replace(/\s+/g, " ").trim();
}

const PLACEHOLDER_VALUE = /^(none|n\/a|null|tbd|unknown(\s.+)?)$/i;

// Firecrawl's model sometimes fills empty fields with the literal string
// "null"/"n/a"/etc. instead of omitting them, so a truthy-check alone lets
// that string through into the database.
function cleanValue(value: string | undefined, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed && !PLACEHOLDER_VALUE.test(trimmed) ? trimmed.slice(0, maxLength) : null;
}

// Some venue pages list everything in caps. Only touch names that are fully
// uppercase (a formatting artifact) — anything already mixed-case (e.g.
// "Bobby McFerrin") or fully lowercase (some artists are genuinely styled
// that way, e.g. "aespa") is left exactly as scraped.
function toTitleCase<T extends string | null>(value: T): T {
  if (!value || value !== value.toUpperCase()) return value;
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/'S\b/g, "'s")
    .replace(/\bMc([a-z])/g, (_, c) => `Mc${c.toUpperCase()}`) as T;
}

const PLACEHOLDER_IMAGE_HOST = /(^|\.)example\.(com|org|net)$/i;

// Upgrade http -> https (the page renders over https, so an http image is
// silently blocked as mixed content) and drop placeholder hosts the model
// sometimes hallucinates (e.g. example.com) when it can't find a real image.
function cleanImageUrl(raw: string | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  const httpsUrl = trimmed.replace(/^http:\/\//i, "https://");
  try {
    if (PLACEHOLDER_IMAGE_HOST.test(new URL(httpsUrl).hostname)) return null;
  } catch {
    return null;
  }
  return httpsUrl;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildPrompt(venue: VenueSource, todayIso: string) {
  if (venue.category === "comedy") {
    return (
      `Extract every upcoming stand-up comedy, improv, sketch, open mic, or comedy showcase listed on this page for ${venue.venue}. ` +
      `Today's date is ${todayIso}; assume listings without a year fall on the next occurrence of that date. ` +
      `Return date as YYYY-MM-DD, time as a readable start time like "8:00 PM", price as a short string (e.g. "$25" or "Free") or null, ` +
      `and ticketUrl as the absolute ticket link (fall back to the page URL). ` +
      `Return imageUrl as the absolute URL of the comedian's photo or show poster if one is shown for this listing, or null if there isn't one. ` +
      `Return genre as one of: Stand-Up, Improv, Sketch, Open Mic, Showcase, Storytelling, Comedy Festival. ` +
      `Put the headlining comedian or show title in artist and any featured/supporting comics in support.` +
      (venue.promptHint ? ` ${venue.promptHint}` : "")
    );
  }

  if (venue.category === "classical") {
    return (
      `Extract every upcoming classical music, symphony, opera, ballet, choral, chamber, organ, or recital performance listed on this page for ${venue.venue}. ` +
      `Today's date is ${todayIso}; assume listings without a year fall on the next occurrence of that date. ` +
      `Return date as YYYY-MM-DD, time as a readable start time like "7:30 PM", price as a short string (e.g. "$45" or "Free") or null, ` +
      `and ticketUrl as the absolute ticket link (fall back to the page URL). ` +
      `Return imageUrl as the absolute URL of the program or performer photo/artwork if one is shown for this listing, or null if there isn't one. ` +
      `Return genre as one of: Symphony, Opera, Ballet, Chamber Music, Choral, Organ / Sacred, Recital, Contemporary Classical, Family Concert. ` +
      `Put the program or production title in artist and the orchestra, company, conductor, or featured soloist in support.` +
      (venue.promptHint ? ` ${venue.promptHint}` : "")
    );
  }

  const isMuseum = venue.category === "museums_exhibits";
  if (isMuseum) {
    return (
      `Extract every current and upcoming exhibition, installation, special display, or museum experience listed on this page for ${venue.venue}. ` +
      `Today's date is ${todayIso}. Include ongoing exhibitions that are open now and any exhibitions with a future opening date. ` +
      `Return date as YYYY-MM-DD. For ongoing exhibitions without a single closing date, use the earliest available date or the opening date. ` +
      `Return time as a readable time like "10:00 AM" or "Open daily" or null. ` +
      `Return genre as the exhibit type (one of: Art, History, Science, Photography, Design, Special Exhibition, Film, Interactive, Family). ` +
      `Return price as a short string (e.g. "$30" or "Free") or null. ticketUrl should be the absolute ticket/visit link (fall back to the page URL). ` +
      `Return imageUrl as the absolute URL of the exhibition's featured image or artwork if one is shown for this listing, or null if there isn't one. ` +
      `Put the exhibition title in artist and any subtitle, featured artist, or short description in support.` +
      (venue.promptHint ? ` ${venue.promptHint}` : "")
    );
  }

  return (
    `Extract every upcoming live music or entertainment event listed on this page for ${venue.venue}. ` +
    `Today's date is ${todayIso}; assume listings without a year fall on the next occurrence of that date. ` +
    `Return date as YYYY-MM-DD, time as a readable start time like "8:00 PM", price as a short string ` +
    `(e.g. "$35" or "Free") or null, genre as a short music genre, and ticketUrl as the absolute ticket link ` +
    `(fall back to the page URL). Return imageUrl as the absolute URL of the artist photo or show poster if one is shown for this listing, or null if there isn't one. ` +
    `Put the headliner in artist and any opener/tour name in support.` +
    (venue.promptHint ? ` ${venue.promptHint}` : "")
  );
}

async function scrapeVenue(venue: VenueSource, todayIso: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Missing Firecrawl credentials");

  const isMuseum = venue.category === "museums_exhibits";

  const request = () => fetch(`${GATEWAY}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({
      url: venue.url,
      onlyMainContent: true,
      formats: [
        {
          type: "json",
          prompt: buildPrompt(venue, todayIso),
          schema: {
            type: "object",
            properties: {
              events: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    artist: { type: "string" },
                    support: { type: "string" },
                    date: { type: "string" },
                    time: { type: "string" },
                    genre: { type: "string" },
                    price: { type: "string" },
                    ticketUrl: { type: "string" },
                    imageUrl: { type: "string" },
                  },
                  required: ["artist", "date"],
                },
              },
            },
            required: ["events"],
          },
        },
      ],
    }),
  });

  // Firecrawl rate-limits (429) and occasionally 502s; back off and retry.
  let response = await request();
  for (let attempt = 0; attempt < 3 && !response.ok; attempt++) {
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await sleep(20000 * (attempt + 1));
    response = await request();
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firecrawl [${response.status}]: ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    json?: { events?: ScrapedEvent[] };
    data?: { json?: { events?: ScrapedEvent[] } };
  };
  const raw = payload.json?.events ?? payload.data?.json?.events ?? [];

  const category = venue.category ?? "concerts";
  const isClassical = venue.category === "classical";
  const isComedy = venue.category === "comedy";
  const normalize = isMuseum
    ? normalizeMuseumType
    : isClassical
      ? normalizeClassicalType
      : isComedy
        ? normalizeComedyType
        : normalizeGenre;
  const nonEvent = isMuseum
    ? NON_MUSEUM
    : isClassical
      ? NON_CLASSICAL
      : isComedy
        ? NON_COMEDY
        : NON_EVENT;

  const rows = raw
    .filter((e) => typeof e.artist === "string" && e.artist.trim() && isIsoDate(e.date))
    .filter((e) => !PLACEHOLDER_VALUE.test((e.artist as string).trim()))
    .filter((e) => (e.date as string) >= todayIso)
    .filter((e) => !nonEvent.test(e.artist as string))
    .filter((e) => !isSportsEvent(e.genre, `${e.artist ?? ""} ${e.support ?? ""}`))
    .map((e) => ({
      fingerprint: fingerprint(venue.venue, e.date as string, e.artist as string, category),
      artist: toTitleCase((e.artist as string).trim().slice(0, 200)),
      support: toTitleCase(cleanValue(e.support, 200)),
      venue: venue.venue,
      city: venue.city,
      date: e.date as string,
      time: cleanValue(e.time, 40),
      genre: normalize(e.genre, `${e.artist ?? ""} ${e.support ?? ""}`),
      price: cleanValue(e.price, 40),
      ticket_url: e.ticketUrl?.startsWith("http") ? e.ticketUrl : venue.url,
      image_url: cleanImageUrl(e.imageUrl),
      source: venue.source,
      category,
      last_seen_at: new Date().toISOString(),
    }));

  // De-duplicate within a single page (same venue/date/artist/category listed twice).
  const seen = new Set<string>();
  const deduped = rows.filter((r) => (seen.has(r.fingerprint) ? false : (seen.add(r.fingerprint), true)));

  // A multi-night listing often has one photo shared across several dates, but the
  // model only attaches it to some of the extracted rows. Reuse it for the rest.
  const imageByArtist = new Map<string, string>();
  for (const r of deduped) {
    if (r.image_url && !imageByArtist.has(r.artist)) imageByArtist.set(r.artist, r.image_url);
  }
  for (const r of deduped) {
    if (!r.image_url) r.image_url = imageByArtist.get(r.artist) ?? null;
  }

  return deduped;
}

export async function refreshEvents(venueNames?: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Venues live in the database so new cities/venues never require a code change.
  // The hardcoded list stays only as a fallback if the table is empty.
  const { data: venueRows } = await supabaseAdmin
    .from("venues")
    .select("id, name, city, category, source_url, source_name, prompt_hint, active")
    .eq("active", true);

  const all: (VenueSource & { id?: string })[] = venueRows?.length
    ? venueRows.map((v) => ({
        id: v.id,
        venue: v.name,
        city: v.city,
        url: v.source_url,
        source: v.source_name,
        category: (v.category as VenueSource["category"]) ?? "concerts",
        ...(v.prompt_hint ? { promptHint: v.prompt_hint } : {}),
      }))
    : VENUE_SOURCES;

  const targets = venueNames?.length ? all.filter((v) => venueNames.includes(v.venue)) : all;
  const runId = crypto.randomUUID();

  const results: { venue: string; found: number; status: string; error?: string }[] = [];

  // Small concurrency so one slow venue doesn't stall the whole run.
  const queue = [...targets];
  const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
    while (queue.length) {
      const venue = queue.shift();
      if (!venue) break;
      const startedAt = Date.now();
      try {
        const rows = await scrapeVenue(venue, todayIso);
        if (rows.length) {
          const { error } = await supabaseAdmin
            .from("events")
            .upsert(
              rows.map((r) => ({ ...r, ...(venue.id ? { venue_id: venue.id } : {}) })),
              { onConflict: "fingerprint" },
            );
          if (error) throw new Error(error.message);
        }
        results.push({ venue: venue.venue, found: rows.length, status: "ok" });
        if (venue.id) {
          await supabaseAdmin
            .from("venues")
            .update({ last_scraped_at: new Date().toISOString() })
            .eq("id", venue.id);
        }
        await supabaseAdmin.from("scrape_runs").insert({
          venue: venue.venue,
          source_url: venue.url,
          events_found: rows.length,
          status: "ok",
          run_id: runId,
          category: venue.category ?? "concerts",
          duration_ms: Date.now() - startedAt,
          ...(venue.id ? { venue_id: venue.id } : {}),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Scrape failed for ${venue.venue}:`, message);
        results.push({ venue: venue.venue, found: 0, status: "error", error: message });
        await supabaseAdmin.from("scrape_runs").insert({
          venue: venue.venue,
          source_url: venue.url,
          events_found: 0,
          status: "error",
          error: message.slice(0, 500),
          run_id: runId,
          category: venue.category ?? "concerts",
          duration_ms: Date.now() - startedAt,
          ...(venue.id ? { venue_id: venue.id } : {}),
        });
      }
    }
  });

  await Promise.all(workers);

  // Drop events that have already happened.
  await supabaseAdmin.from("events").delete().lt("date", todayIso);

  return {
    ranAt: new Date().toISOString(),
    venues: results.length,
    totalEvents: results.reduce((sum, r) => sum + r.found, 0),
    results,
  };
}
