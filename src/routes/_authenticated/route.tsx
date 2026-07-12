import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
<<<<<<< HEAD
import { getCurrentUser } from "@/lib/firebase";
=======
import { supabase } from "@/integrations/supabase/client";
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
<<<<<<< HEAD
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
=======
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
