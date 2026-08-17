export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artist: string
          category: string
          city: string
          created_at: string
          date: string
          external_id: string | null
          fingerprint: string
          genre: string
          id: string
          image_url: string | null
          last_seen_at: string
          price: string | null
          raw_data: Json | null
          source: string
          status: string
          support: string | null
          ticket_url: string
          time: string | null
          trending: boolean
          updated_at: string
          venue: string
          venue_id: string | null
        }
        Insert: {
          artist: string
          category?: string
          city?: string
          created_at?: string
          date: string
          external_id?: string | null
          fingerprint: string
          genre?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          price?: string | null
          raw_data?: Json | null
          source: string
          status?: string
          support?: string | null
          ticket_url: string
          time?: string | null
          trending?: boolean
          updated_at?: string
          venue: string
          venue_id?: string | null
        }
        Update: {
          artist?: string
          category?: string
          city?: string
          created_at?: string
          date?: string
          external_id?: string | null
          fingerprint?: string
          genre?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          price?: string | null
          raw_data?: Json | null
          source?: string
          status?: string
          support?: string | null
          ticket_url?: string
          time?: string | null
          trending?: boolean
          updated_at?: string
          venue?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          home_city: string | null
          id: string
          radius_miles: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          home_city?: string | null
          id: string
          radius_miles?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          home_city?: string | null
          id?: string
          radius_miles?: number
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          market_id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          market_id: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          market_id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          category: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          events_found: number
          id: string
          run_id: string | null
          source_url: string
          status: string
          venue: string
          venue_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          events_found?: number
          id?: string
          run_id?: string | null
          source_url: string
          status?: string
          venue: string
          venue_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          events_found?: number
          id?: string
          run_id?: string | null
          source_url?: string
          status?: string
          venue?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          cities: string[]
          created_at: string
          email_alerts: boolean
          genres: string[]
          max_price: number | null
          updated_at: string
          user_id: string
          venues: string[]
        }
        Insert: {
          cities?: string[]
          created_at?: string
          email_alerts?: boolean
          genres?: string[]
          max_price?: number | null
          updated_at?: string
          user_id: string
          venues?: string[]
        }
        Update: {
          cities?: string[]
          created_at?: string
          email_alerts?: boolean
          genres?: string[]
          max_price?: number | null
          updated_at?: string
          user_id?: string
          venues?: string[]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          active: boolean
          category: string
          city: string
          city_id: string | null
          created_at: string
          id: string
          last_scraped_at: string | null
          name: string
          prompt_hint: string | null
          scraper_config: Json
          source_name: string
          source_url: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          city: string
          city_id?: string | null
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          name: string
          prompt_hint?: string | null
          scraper_config?: Json
          source_name: string
          source_url: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          city?: string
          city_id?: string | null
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          name?: string
          prompt_hint?: string | null
          scraper_config?: Json
          source_name?: string
          source_url?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
