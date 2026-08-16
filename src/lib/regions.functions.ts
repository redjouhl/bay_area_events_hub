import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type RegionOption = { slug: string; name: string; cities: string[] };

/** Regions + their cities, driven by the database so new markets need no code change. */
export const getRegions = createServerFn({ method: "GET" }).handler(
  async (): Promise<RegionOption[]> => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("regions")
      .select("slug, name, sort_order, active, cities(name, active)")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to load regions:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      slug: r.slug,
      name: r.name,
      cities: (r.cities ?? []).filter((c) => c.active !== false).map((c) => c.name),
    }));
  },
);
