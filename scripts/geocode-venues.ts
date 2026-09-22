// One-off backfill: geocodes every venue missing lat/lng via OpenStreetMap's
// free Nominatim API (no key required) and writes the coordinates back.
// Usage: bun run scripts/geocode-venues.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment (.env).");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "OutsyEventsApp/1.0 (contact: redjouhl@gmail.com)" },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { lat: string; lon: string }[];
  const first = rows[0];
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

async function main() {
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, city")
    .is("lat", null);
  if (error) throw new Error(error.message);
  if (!venues?.length) {
    console.log("Nothing to geocode — every venue already has coordinates.");
    return;
  }

  console.log(`Geocoding ${venues.length} venues...`);
  let ok = 0;
  let failed = 0;

  for (const venue of venues) {
    const query = `${venue.name}, ${venue.city}, California, USA`;
    const coords = await geocode(query);
    if (coords) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", venue.id);
      if (updateError) {
        console.error(`  ✗ ${venue.name}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✓ ${venue.name} -> ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        ok++;
      }
    } else {
      console.warn(`  ✗ ${venue.name}: no geocoding match for "${query}"`);
      failed++;
    }
    // Nominatim's usage policy caps requests at 1/sec.
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`\nDone. ${ok} geocoded, ${failed} failed.`);
}

main();
