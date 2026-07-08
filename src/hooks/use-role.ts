import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "affiliate" | "user";

type RoleState = {
  loading: boolean;
  user: User | null;
  role: AppRole | null;
  isAdmin: boolean;
  isAffiliate: boolean;
};

export function useRole(): RoleState {
  const [state, setState] = useState<RoleState>({
    loading: true, user: null, role: null, isAdmin: false, isAffiliate: false,
  });

  useEffect(() => {
    let mounted = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (mounted) setState({ loading: false, user: null, role: null, isAdmin: false, isAffiliate: false });
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      // Admin wins if present.
      const role: AppRole = roles.includes("admin") ? "admin" : roles.includes("affiliate") ? "affiliate" : "user";
      if (mounted) {
        setState({
          loading: false,
          user,
          role,
          isAdmin: role === "admin",
          isAffiliate: role === "affiliate",
        });
      }
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        resolve(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
