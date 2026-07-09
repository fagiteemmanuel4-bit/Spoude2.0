import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Landing page removed on user request.
 * Signed-in users land on /spoude; everyone else goes to /auth.
 */
export const Route = createFileRoute("/")({
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
    if (user) {
      const profileSnap = await getDoc(doc(db, "profiles", user.uid));
      const profile = profileSnap.data();
      if (profile?.role === "university") {
        throw redirect({ to: "/university-dashboard", replace: true });
      } else {
        throw redirect({ to: "/spoude", replace: true });
      }
    }
    throw redirect({ to: "/auth", replace: true });
  },
  component: () => null,
});
