import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpoudeWordmark } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — Spoude" }],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/\d/, "Add a number");

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The reset link from Supabase's email establishes a temporary recovery
  // session automatically (via the URL hash) — we just need to wait for
  // that session to be present before allowing a password update.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated");
      setTimeout(() => navigate({ to: "/lumio", replace: true }), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="mb-8">
        <SpoudeWordmark to="/auth" size={24} />
      </div>

      <div
        className="w-full max-w-sm rounded-3xl border border-border shadow-elev-3 p-6 sm:p-7 animate-fade-up"
        style={{ background: "var(--popover)" }}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="h-11 w-11 rounded-2xl bg-primary-soft mx-auto flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-sm font-medium">Password updated</p>
            <p className="mt-1 text-xs text-muted-foreground">Taking you to your dashboard…</p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Confirming your reset link… if this doesn't finish in a few seconds, the link may have
              expired — request a new one from the sign-in page.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold tracking-tight">Choose a new password</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Make it something you haven't used before.</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  New password
                </span>
                <div className="flex items-center gap-2.5 rounded-xl border border-input bg-card/60 px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="8+ chars, mixed case, number"
                  />
                </div>
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Confirm password
                </span>
                <div className="flex items-center gap-2.5 rounded-xl border border-input bg-card/60 px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    maxLength={72}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
