import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Concert } from "@/data/concerts";

export const getEvents = createServerFn({ method: "GET" }).handler(async (): Promise<Concert[]> => {
  const supabase = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("events")
    .select("id, artist, support, venue, city, date, time, genre, price, ticket_url, image_url, source, trending, category")
    .order("date", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("Failed to load events:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    artist: row.artist,
    ...(row.support ? { support: row.support } : {}),
    venue: row.venue,
    city: row.city,
    date: row.date,
    time: row.time ?? "",
    genre: row.genre,
    price: row.price ?? "",
    ticketUrl: row.ticket_url,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    source: row.source,
    trending: row.trending ?? false,
    category: (row.category as "concerts" | "museums_exhibits" | "classical" | "comedy" | "theater" | "sports" | "other") ?? "concerts",
  }));
});
