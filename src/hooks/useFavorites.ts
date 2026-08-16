import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("event_id");
      if (error) throw error;
      return data.map((row) => row.event_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (eventId: string) => {
      if (!userId) throw new Error("Not signed in");
      if (favoriteIds.includes(eventId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ event_id: eventId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites", userId] }),
  });

  return {
    favoriteIds,
    isFavorite: (id: string) => favoriteIds.includes(id),
    toggleFavorite: (id: string) => toggle.mutate(id),
    canFavorite: !!userId,
  };
}
