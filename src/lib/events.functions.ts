import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Concert } from "@/data/concerts";
import { pacificToday } from "@/lib/date-ranges";

export const getEvents = createServerFn({ method: "GET" }).handler(async (): Promise<Concert[]> => {
  const supabase = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  // Without this, a stale/unscraped venue's past-dated rows never leave the
  // homepage on their own, and — since results are ordered oldest-first —
  // enough of them can even push genuinely upcoming events past the
  // 1000-row cap below.
  const { data, error } = await supabase
    .from("events")
    .select("id, artist, support, venue, city, date, time, genre, price, ticket_url, image_url, source, trending, category")
    .gte("date", pacificToday())
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

export const getEventById = createServerFn({ method: "GET" })
  .inputValidator((id: unknown) => z.string().uuid().parse(id))
  .handler(async ({ data: id }): Promise<Concert | null> => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("events")
      .select("id, artist, support, venue, city, date, time, genre, price, ticket_url, image_url, source, trending, category")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      artist: data.artist,
      ...(data.support ? { support: data.support } : {}),
      venue: data.venue,
      city: data.city,
      date: data.date,
      time: data.time ?? "",
      genre: data.genre,
      price: data.price ?? "",
      ticketUrl: data.ticket_url,
      ...(data.image_url ? { imageUrl: data.image_url } : {}),
      source: data.source,
      trending: data.trending ?? false,
      category: (data.category as Concert["category"]) ?? "concerts",
    };
  });
