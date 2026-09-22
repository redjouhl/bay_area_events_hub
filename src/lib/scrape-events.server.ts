import { VENUE_SOURCES, type VenueSource } from "@/data/venues";

const GATEWAY = "https://api.firecrawl.dev/v2";

const ALLOWED_GENRES = [
  "Indie",
  "Rock",
  "Hip-Hop",
  "Electronic",
  "Jazz",
  "Metal",
  "Latin",
  "Country",
  "Punk",
  "Soul / R&B",
  "World Music",
  "Open Mic",
  "Children",
  "Other",
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
  "Other",
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

const SPORTS = /(soccer|football|basketball|hockey|baseball|cricket|wrestl|boxing|\bmma\b|\bufc\b|roller derby|rugby|lacrosse|\bvs\.?\b|oakland roots|golden state warriors|oakland ballers|golden state valkyries|san jose earthquakes|bay fc|san francisco unicorns)/i;
// "baby" alone is deliberately excluded: too many real artist names contain
// it (e.g. rap acts) and would false-positive into the Children genre.
// "disney" is forced here too — Disney-branded events (on Ice, sing-alongs,
// character meet-and-greets, etc.) are family content regardless of what
// else the page copy says.
const CHILDREN = /(story ?time|kids|children|family show|toddler|preschool|puppet|sing[- ]?along for kids|for babies|disney)/i;

// The scrape model still defaults some well-known artists to "Rock" despite
// the prompt telling it not to (Billy Strings and Kacey Musgraves both did,
// at Oakland Arena) — named the same way sports teams and comedians are
// elsewhere in this file. Checked against title/artist text, not the
// model's raw genre guess, since by the time we see it that's often
// already wrong.
const KNOWN_COUNTRY_ARTISTS = /\b(billy strings|kacey musgraves)\b/i;

function normalizeGenre(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  if (CHILDREN.test(text)) return "Children";
  if (KNOWN_COUNTRY_ARTISTS.test(text)) return "Country";
  const g = (raw ?? "").toLowerCase();
  if (g.includes("hip") || g.includes("rap")) return "Hip-Hop";
  if (g.includes("electro") || g.includes("dance") || g.includes("house") || g.includes("techno"))
    return "Electronic";
  if (g.includes("jazz")) return "Jazz";
  if (g.includes("metal")) return "Metal";
  if (g.includes("latin") || g.includes("salsa") || g.includes("cumbia")) return "Latin";
  if (g.includes("country") || g.includes("bluegrass") || g.includes("americana")) return "Country";
  if (g.includes("punk")) return "Punk";
  if (g.includes("soul") || g.includes("r&b") || g.includes("blues") || g.includes("funk"))
    return "Soul / R&B";
  if (g.includes("indie") || g.includes("folk") || g.includes("pop")) return "Indie";
  if (g.includes("reggae") || g.includes("ska") || g.includes("afrobeat") || g.includes("african") || g.includes("world"))
    return "World Music";
  if (g.includes("open mic")) return "Open Mic";
  const exact = ALLOWED_GENRES.find((x) => x.toLowerCase() === g);
  return exact ?? "Other";
}

// Spotify's artist genres are ground truth rather than a page-scrape guess,
// but they're far more granular than our taxonomy (e.g. "modern bollywood",
// "desi hip hop", "conscious hip hop") — map the tag list down to one of our
// buckets. Order matters: more specific/frequently-confused genres first.
function mapSpotifyGenres(genres: string[]): string | null {
  const g = genres.join(" | ").toLowerCase();
  if (!g) return null;
  if (/hip hop|rap|trap/.test(g)) return "Hip-Hop";
  if (/edm|electro|house|techno|dubstep|drum and bass|trance|dance pop/.test(g)) return "Electronic";
  if (/jazz/.test(g)) return "Jazz";
  if (/metal/.test(g)) return "Metal";
  if (/latin|reggaeton|salsa|cumbia|bachata|banda|mariachi|corrido/.test(g)) return "Latin";
  if (/\bcountry\b|bluegrass|americana|old time/.test(g)) return "Country";
  if (/punk/.test(g)) return "Punk";
  if (/soul|r&b|\bfunk\b|blues|gospel/.test(g)) return "Soul / R&B";
  if (
    /reggae|\bska\b|afrobeat|afrobeats|amapiano|highlife|african|bollywood|desi|punjabi|bhangra|qawwali|sufi|carnatic|hindustani|indian|k-pop|j-pop|mandopop|cpop|arab|middle eastern|klezmer|\bworld\b/.test(
      g,
    )
  )
    return "World Music";
  if (/indie|folk|singer-songwriter/.test(g)) return "Indie";
  if (/^rock$|\brock\b/.test(g)) return "Rock";
  return null;
}

let spotifyToken: { value: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const id = process.env["SPOTIFY_CLIENT_ID"];
  const secret = process.env["SPOTIFY_CLIENT_SECRET"];
  if (!id || !secret) return null;
  if (spotifyToken && spotifyToken.expiresAt > Date.now()) return spotifyToken.value;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    spotifyToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000 };
    return spotifyToken.value;
  } catch {
    return null;
  }
}

function normalizeArtistName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Looks up an artist's real genres on Spotify and maps them to our taxonomy.
// Only trusts an exact (normalized) name match — a fuzzy/wrong match would be
// worse than no enrichment at all, since we'd silently overwrite a reasonable
// guess with a confidently wrong one.
async function lookupSpotifyGenre(token: string, artist: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.spotify.com/v1/search?type=artist&limit=1&q=${encodeURIComponent(artist)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { artists?: { items?: { name?: string; genres?: string[] }[] } };
    const item = data.artists?.items?.[0];
    if (!item?.name || !item.genres?.length) return null;
    if (normalizeArtistName(item.name) !== normalizeArtistName(artist)) return null;
    return mapSpotifyGenres(item.genres);
  } catch {
    return null;
  }
}

// Enriches concert rows' genre using real Spotify data where we can get a
// confident match, falling back to whatever the page-scrape already guessed.
// Cache is shared across the whole refresh run so the same touring artist
// playing multiple venues only costs one Spotify lookup.
async function enrichGenresWithSpotify(rows: { artist: string; genre: string }[], cache: Map<string, string | null>) {
  const token = await getSpotifyToken();
  if (!token) return;
  for (const row of rows) {
    const key = normalizeArtistName(row.artist);
    if (!cache.has(key)) cache.set(key, await lookupSpotifyGenre(token, row.artist));
    const spotifyGenre = cache.get(key);
    if (spotifyGenre) row.genre = spotifyGenre;
  }
}

// Each sports venue in the database is dedicated to exactly one team, so the
// league is derived from the team name rather than trusting the model's
// freeform genre field.
function normalizeSportsGenre(teamName: string) {
  const key = teamName.toLowerCase();
  if (key.includes("valkyries")) return "WNBA";
  if (key.includes("warriors")) return "NBA";
  if (key.includes("giants")) return "MLB";
  if (key.includes("ballers")) return "Baseball";
  if (key.includes("49ers")) return "NFL";
  if (key.includes("sharks")) return "NHL";
  if (key.includes("earthquakes")) return "MLS";
  if (key.includes("bay fc")) return "NWSL";
  if (key.includes("roots")) return "USL";
  if (key.includes("unicorns")) return "Cricket";
  return "Other";
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
  if (/(family|kids|children|disney)/i.test(text)) return "Family";
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

const ALLOWED_THEATER_TYPES = [
  "Play",
  "Musical",
  "Drama",
  "Comedy",
  "Family",
  "Immersive",
  "New Work",
  "Classic Revival",
];

function normalizeTheaterType(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  const lower = (raw ?? "").toLowerCase();
  if (/(musical|the musical)/i.test(text)) return "Musical";
  if (/(world premiere|new work|new play)/i.test(text)) return "New Work";
  if (/(revival|classic|shakespeare|chekhov|ibsen)/i.test(text)) return "Classic Revival";
  if (/(immersive|interactive)/i.test(text)) return "Immersive";
  if (/(family|kids|children|disney)/i.test(text)) return "Family";
  if (/(comedy|farce)/i.test(text)) return "Comedy";
  if (/(drama|tragedy)/i.test(text)) return "Drama";
  const exact = ALLOWED_THEATER_TYPES.find((x) => x.toLowerCase() === lower);
  return exact ?? "Play";
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
  if (/(family|kids|children|disney)/i.test(text)) return "Family Concert";
  if (/(symphony|orchestra|philharmonic|concerto|symphonic)/i.test(text)) return "Symphony";
  const exact = ALLOWED_CLASSICAL_TYPES.find((x) => x.toLowerCase() === lower);
  return exact ?? "Other";
}

function isSportsEvent(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  if (SPORTS.test(text)) return true;
  const g = (raw ?? "").toLowerCase();
  return g.includes("sport");
}

// A general-purpose "concerts" venue occasionally books a stand-up
// comedian instead of a musician (Jo Koy at a music venue was the case
// that surfaced this). Left alone, the concerts genre picker has nothing
// comedy-shaped to match, and the model's page-scrape guess tends to
// default to "Rock" for an artist it doesn't recognize as a musician. So
// this is checked before genre normalization and moves the whole row to
// the Comedy category instead. Named comedians are hardcoded the same
// way sports team names are above, since there's no generic keyword that
// reliably says "this artist is a comedian" — add more names here as
// they turn up.
const COMEDY_SIGNAL = /(stand-?up comedy|stand-?up comedian|\bcomedian\b|comedy (show|night|tour|special))/i;
const KNOWN_COMEDIANS = /\b(jo koy|gabriel iglesias|fluffy)\b/i;

function isComedianBooking(raw?: string, title?: string) {
  const text = `${title ?? ""} ${raw ?? ""}`;
  return COMEDY_SIGNAL.test(text) || KNOWN_COMEDIANS.test(text);
}

const NON_EVENT = /(yoga|fitness class|parking|tour of|museum|open gym|private event|luxury suite|season ticket)/i;
const NON_MUSEUM = /(private event|rental|wedding|corporate|members-only|closed)/i;
const NON_CLASSICAL = /(private event|rental|wedding|corporate|parking|guided tour|worship service|sunday mass|yoga)/i;
const NON_COMEDY = /(private event|rental|corporate|parking|class\b|workshop)/i;
const NON_THEATER = /(private event|rental|wedding|corporate|parking|guided tour|workshop|class\b|auditions?)/i;

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function fingerprint(venue: string, date: string, artist: string, category: string) {
  return `${venue}|${date}|${artist}|${category}`.toLowerCase().replace(/\s+/g, " ").trim();
}

// The trailing alternative catches values with no letters or digits at all
// (e.g. a lone "/" or "-" the model hallucinates from a page separator).
const PLACEHOLDER_VALUE = /^(none|n\/a|null|tbd|unknown(\s.+)?)$|^[^a-z0-9]*$/i;

// Firecrawl's model sometimes fills empty fields with the literal string
// "null"/"n/a"/etc. instead of omitting them, so a truthy-check alone lets
// that string through into the database.
function cleanValue(value: string | undefined, maxLength: number) {
  const trimmed = value?.trim();
  return trimmed && !PLACEHOLDER_VALUE.test(trimmed) ? trimmed.slice(0, maxLength) : null;
}

// The model occasionally grabs a "Buy Tickets" button's href/label instead
// of the listed price (e.g. "/buy-tickets"), which would otherwise render
// as-is where a dollar amount belongs. Reject anything link-shaped.
function cleanPrice(value: string | undefined) {
  const trimmed = cleanValue(value, 40);
  if (!trimmed) return null;
  return /^\/|^https?:\/\//i.test(trimmed) ? null : trimmed;
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

// Paste/note-sharing hosts occasionally show up embedded in a venue's own
// page (a stray dev artifact, an old widget) and get mistaken for the real
// ticket link. They're never a legitimate ticket/event-info URL.
const JUNK_TICKET_HOST = /(^|\.)(pastie\.org|pastebin\.com|paste\.ee|hastebin\.com)$/i;

function cleanTicketUrl(raw: string | undefined, fallback: string) {
  const trimmed = raw?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return fallback;
  try {
    if (JUNK_TICKET_HOST.test(new URL(trimmed).hostname)) return fallback;
  } catch {
    return fallback;
  }
  return trimmed;
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
      `Return genre as one of: Symphony, Opera, Ballet, Chamber Music, Choral, Organ / Sacred, Recital, Contemporary Classical, Family Concert, Other. ` +
      `Use Other for anything that isn't primarily a musical performance in one of those forms (e.g. a lecture, talk, or hybrid theatrical/multimedia work). ` +
      `Put the program or production title in artist and the orchestra, company, conductor, or featured soloist in support.` +
      (venue.promptHint ? ` ${venue.promptHint}` : "")
    );
  }

  if (venue.category === "theater") {
    return (
      `Extract every upcoming play, musical, or theatrical production listed on this page for ${venue.venue}. ` +
      `Today's date is ${todayIso}; assume listings without a year fall on the next occurrence of that date. For a run with multiple performance dates, extract the opening date. ` +
      `Return date as YYYY-MM-DD, time as a readable start time like "7:30 PM" or null, price as a short string (e.g. "$65" or "Free") or null, ` +
      `and ticketUrl as the absolute ticket link (fall back to the page URL). ` +
      `Return imageUrl as the absolute URL of the production's key art or poster if one is shown for this listing, or null if there isn't one. ` +
      `Return genre as one of: Play, Musical, Drama, Comedy, Family, Immersive, New Work, Classic Revival. ` +
      `Put the production title in artist and the playwright, director, or company in support.` +
      (venue.promptHint ? ` ${venue.promptHint}` : "")
    );
  }

  if (venue.category === "sports") {
    return (
      `Extract every upcoming home game listed on this schedule page for ${venue.venue}. Only include games actually played at ${venue.venue}; skip away games. ` +
      `Today's date is ${todayIso}; assume listings without a year fall on the next occurrence of that date. ` +
      `Return date as YYYY-MM-DD, time as a readable start time like "7:00 PM" or null, price as a short string (e.g. "$45" or "From $45") or null, ` +
      `and ticketUrl as the absolute ticket link (fall back to the page URL). ` +
      `Return imageUrl as the absolute URL of the opponent's logo or a matchup graphic if one is shown for this listing, or null if there isn't one. ` +
      `Return genre as one of: NBA, WNBA, MLB, Baseball, NFL, NHL, MLS, NWSL, USL, Cricket, whichever league this team plays in. ` +
      `Put the matchup in artist as "${venue.source} vs. [Opponent]" (fill in the real opponent), and leave support empty unless the page calls out something notable like a playoff round or a themed night.` +
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
    `(e.g. "$35" or "Free") or null, genre as one of: Indie, Rock, Hip-Hop, Electronic, Jazz, Metal, Latin, Country, Punk, Soul / R&B, World Music, Open Mic, Children, Other. ` +
    `Many venue pages tag each listing with its own genre/category right on the page (a colored label or text like "Jazz", "Bluegrass", "Reggae", "Workshop") — when a listing has one, that's the primary signal: map it to the closest allowed value instead of guessing from the artist name. ` +
    `If there's no such label, determine genre from what you actually know about the artist's real musical style — don't default to Rock just because the page gives you nothing to go on. ` +
    `Use Open Mic for open mic nights, jam sessions, and other come-one-come-all musician nights. ` +
    `Use Country for country, bluegrass, and Americana acts (e.g. Billy Strings, Kacey Musgraves) — don't fold these into Indie. Use World Music for reggae, ska, afrobeat, African, Bollywood/Indian, Middle Eastern, or other global/traditional genres. Use Indie for folk, singer-songwriter, and other non-mainstream acoustic/alternative acts that aren't specifically country or bluegrass. ` +
    `If you don't actually recognize the artist or their style, use Other rather than guessing Rock as a safe default — a wrong specific genre is worse than an honest Other. Also use Other for listings that aren't really a performance (e.g. a paid class/workshop) even if a specific instructor is well-known for a genre. ` +
    `Return ticketUrl as the absolute ticket link (fall back to the page URL). Return imageUrl as the absolute URL of that specific listing's own artist photo or show poster if one is shown — each listing has its own image; never reuse another listing's photo just because they're adjacent on the page or share a venue, unless the page explicitly shows one shared image for a multi-act bill. Use null if there isn't one. ` +
    `Put the headliner in artist and any opener/tour name in support. ` +
    `Use the event's full listed title as artist, including qualifiers like "Dance Night", "Tribute", or "vs" — ` +
    `never shorten a themed/tribute night's title down to just a celebrity's name, since that would wrongly imply they're performing live.` +
    (venue.promptHint ? ` ${venue.promptHint}` : "")
  );
}

async function scrapeVenue(venue: VenueSource, todayIso: string) {
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!firecrawlKey) throw new Error("Missing Firecrawl credentials");

  const isMuseum = venue.category === "museums_exhibits";

  const request = () => fetch(`${GATEWAY}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({
      url: venue.url,
      onlyMainContent: true,
      formats: [
        {
          type: "json",
          prompt:
            buildPrompt(venue, todayIso) +
            ` If this page has no real, dated events actually listed (e.g. it's a nav menu, a ministry/about page, or an empty calendar template), return an empty events array. Never invent a plausible-sounding event that isn't explicitly on the page.` +
            ` If a listing is explicitly marked as sold out on the page, return price as exactly "Sold Out" for that listing (still include it — don't drop it).`,
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
  const isTheater = venue.category === "theater";
  const isSports = venue.category === "sports";
  const normalize = isMuseum
    ? normalizeMuseumType
    : isClassical
      ? normalizeClassicalType
      : isComedy
        ? normalizeComedyType
        : isTheater
          ? normalizeTheaterType
          : isSports
            ? () => normalizeSportsGenre(venue.source)
            : normalizeGenre;
  const nonEvent = isMuseum
    ? NON_MUSEUM
    : isClassical
      ? NON_CLASSICAL
      : isComedy
        ? NON_COMEDY
        : isTheater
          ? NON_THEATER
          : NON_EVENT;

  const rows = raw
    .filter((e) => typeof e.artist === "string" && e.artist.trim() && isIsoDate(e.date))
    .filter((e) => !PLACEHOLDER_VALUE.test((e.artist as string).trim()))
    .filter((e) => (e.date as string) >= todayIso)
    .filter((e) => !nonEvent.test(e.artist as string))
    .filter((e) => isSports || !isSportsEvent(e.genre, `${e.artist ?? ""} ${e.support ?? ""}`))
    .map((e) => {
      const text = `${e.artist ?? ""} ${e.support ?? ""}`;
      const forcedComedy = category === "concerts" && isComedianBooking(e.genre, text);
      const genre = forcedComedy ? normalizeComedyType(e.genre, text) : normalize(e.genre, text);
      // A classical-venue listing that isn't really a musical performance
      // (a lecture, a hybrid multimedia work, etc.) goes to the "Other"
      // category instead of cluttering Classical / Symphony with a genre
      // that doesn't belong there.
      const rowCategory = forcedComedy ? "comedy" : isClassical && genre === "Other" ? "other" : category;
      return {
        fingerprint: fingerprint(venue.venue, e.date as string, e.artist as string, rowCategory),
        artist: toTitleCase((e.artist as string).trim().slice(0, 200)),
        support: toTitleCase(cleanValue(e.support, 200)),
        venue: venue.venue,
        city: venue.city,
        date: e.date as string,
        time: cleanValue(e.time, 40),
        genre,
        price: cleanPrice(e.price),
        ticket_url: cleanTicketUrl(e.ticketUrl, venue.url),
        image_url: cleanImageUrl(e.imageUrl),
        source: venue.source,
        category: rowCategory,
        last_seen_at: new Date().toISOString(),
      };
    });

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

  // Sweep out anything that's already in the past. This piggybacks on
  // whatever already triggered a refresh (the weekly cron or a manual
  // hook call) instead of a separate midnight job, since deleting rows
  // is a plain Supabase query — it doesn't touch Firecrawl, so it costs
  // no extra scrape credits regardless of how often it runs.
  await supabaseAdmin.from("events").delete().lt("date", todayIso);

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
  const spotifyGenreCache = new Map<string, string | null>();

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
        // Rows forced into Comedy above (a comedian booked at a concerts
        // venue) skip Spotify enrichment too — remapping "Rock" is no fix
        // if the next step reintroduces a music genre from a stray tag match.
        const concertRows = rows.filter((r) => r.category === "concerts");
        if (venue.category === "concerts" && concertRows.length) {
          await enrichGenresWithSpotify(concertRows, spotifyGenreCache);
        }
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
