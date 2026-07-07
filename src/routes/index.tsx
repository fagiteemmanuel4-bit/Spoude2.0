import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Landing page removed on user request.
 * Signed-in users land on /lumio; everyone else goes to /auth.
 */
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/lumio", replace: true });
    throw redirect({ to: "/auth", replace: true });
  },
  component: () => null,
});
