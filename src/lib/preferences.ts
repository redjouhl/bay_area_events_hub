import type { Concert } from "@/data/concerts";

export type Preferences = {
  genres: string[];
  cities: string[];
  venues: string[];
  max_price: number | null;
  email_alerts: boolean;
};

export const EMPTY_PREFS: Preferences = {
  genres: [],
  cities: [],
  venues: [],
  max_price: null,
  email_alerts: false,
};

export const REGION_CITIES: Record<string, string[]> = {
  "East Bay": ["Oakland", "Berkeley"],
  "South Bay": ["San Jose", "Mountain View"],
};

function expandCities(cities: string[]) {
  return cities.flatMap((c) => REGION_CITIES[c] ?? [c]);
}

function priceOf(price: string): number | null {
  const match = price.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function hasPreferences(prefs: Preferences) {
  return (
    prefs.genres.length > 0 ||
    prefs.cities.length > 0 ||
    prefs.venues.length > 0 ||
    prefs.max_price != null
  );
}

/** Score a concert against saved preferences; null means it doesn't match. */
export function matchesPreferences(concert: Concert, prefs: Preferences): boolean {
  if (prefs.genres.length && !prefs.genres.includes(concert.genre)) return false;
  if (prefs.cities.length && !expandCities(prefs.cities).includes(concert.city)) return false;
  if (prefs.venues.length && !prefs.venues.includes(concert.venue)) return false;
  if (prefs.max_price != null) {
    const p = priceOf(concert.price ?? "");
    if (p != null && p > prefs.max_price) return false;
  }
  return true;
}
