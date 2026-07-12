import { createFileRoute, redirect } from "@tanstack/react-router";
<<<<<<< HEAD
import { getCurrentUser } from "@/lib/firebase";

/**
 * Landing page removed on user request.
 * Signed-in users land on /spoude; everyone else goes to /auth.
=======
import { supabase } from "@/integrations/supabase/client";

/**
 * Landing page removed on user request.
 * Signed-in users land on /lumio; everyone else goes to /auth.
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
 */
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
<<<<<<< HEAD
    const user = await getCurrentUser();
    if (user) throw redirect({ to: "/spoude", replace: true });
=======
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/lumio", replace: true });
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
    throw redirect({ to: "/auth", replace: true });
  },
  component: () => null,
});
