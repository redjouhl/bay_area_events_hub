import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type VenueCoordinate = { name: string; lat: number; lng: number };

// Untyped client: lat/lng predate the last generated Database types.
export const getVenueCoordinates = createServerFn({ method: "GET" }).handler(
  async (): Promise<VenueCoordinate[]> => {
    const supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("venues")
      .select("name, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) {
      console.error("Failed to load venue coordinates:", error.message);
      return [];
    }

    return (data ?? []).map((v) => ({ name: v.name as string, lat: v.lat as number, lng: v.lng as number }));
  },
);
