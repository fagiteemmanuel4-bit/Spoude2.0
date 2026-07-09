import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Wait for auth to be initialized
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve();
      });
    });

    const user = auth.currentUser;
    if (!user) throw redirect({ to: "/auth" });

    // Fetch user profile from Firestore to identify roles (e.g. university role redirects)
    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    const profile = profileSnap.data();

    return { user, profile };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
