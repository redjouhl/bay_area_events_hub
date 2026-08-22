import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pacificToday } from "@/lib/date-ranges";

export type AdminVenue = {
  id: string;
  name: string;
  city: string;
  category: string;
  source_url: string;
  source_name: string;
  prompt_hint: string | null;
  active: boolean;
  last_scraped_at: string | null;
};

const venueInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  city: z.string().min(1),
  category: z.string().min(1),
  source_url: z.string().url(),
  source_name: z.string().min(1),
  prompt_hint: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return Boolean(data);
  });

export const listVenues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminVenue[]> => {
    const { data, error } = await context.supabase
      .from("venues")
      .select("id, name, city, category, source_url, source_name, prompt_hint, active, last_scraped_at")
      .order("city", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminVenue[];
  });

export const saveVenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => venueInput.parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const row = { ...rest, prompt_hint: data.prompt_hint || null };
    const { error } = id
      ? await context.supabase.from("venues").update(row).eq("id", id)
      : await context.supabase.from("venues").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("venues").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminEvent = {
  id: string;
  artist: string;
  venue: string;
  city: string;
  date: string;
  category: string;
  trending: boolean;
};

export const listUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminEvent[]> => {
    const { data, error } = await context.supabase
      .from("events")
      .select("id, artist, venue, city, date, category, trending")
      .gte("date", pacificToday())
      .order("date", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, trending: r.trending ?? false })) as AdminEvent[];
  });

const trendingInput = z.object({ id: z.string().uuid(), trending: z.boolean() });

export const setEventTrending = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => trendingInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("events").update({ trending: data.trending }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const importVenues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(venueInput.omit({ id: true })) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!data.rows.length) return { inserted: 0 };
    const { error } = await context.supabase.from("venues").upsert(
      data.rows.map((r) => ({ ...r, prompt_hint: r.prompt_hint || null })),
      { onConflict: "name,source_url,category" },
    );
    if (error) throw new Error(error.message);
    return { inserted: data.rows.length };
  });