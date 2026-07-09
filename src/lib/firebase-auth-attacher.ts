import { createMiddleware } from "@tanstack/react-start";
import { auth } from "@/lib/firebase";

export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : null;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
