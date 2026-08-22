import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, LogOut, Sparkles, SlidersHorizontal, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { amIAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin(), enabled: Boolean(user) });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6">
      <Link to="/" className="flex items-center gap-2 text-display text-2xl tracking-widest text-foreground">
        <CalendarDays className="h-6 w-6 text-primary" />
        HAPPENLY
      </Link>

      <nav className="flex items-center gap-2">
        {user ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/for-you">
                <Sparkles className="mr-1 h-4 w-4" /> For you
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/preferences">
                <SlidersHorizontal className="mr-1 h-4 w-4" /> Preferences
              </Link>
            </Button>
            {admin.data && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">
                  <Shield className="mr-1 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </>
        ) : (
          <Button asChild size="sm" className="font-semibold uppercase tracking-wide">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
