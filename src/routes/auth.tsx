import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  User as UserIcon,
  Volume2,
  VolumeX,
  KeyRound,
} from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Spoude" },
      { name: "description", content: "Sign in or create your Spoude account." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "Too long")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/\d/, "Add a number"),
  name: z.string().trim().min(1, "Required").max(80),
});

const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

type Step = "credentials" | "mfa";
type Mode = "signin" | "signup" | "forgot" | "reset";

// Brand colors lifted from the Spoude logo — blue wordmark, gold "e".
const SPOUDE_BLUE = "#4F6EF5";
const SPOUDE_GOLD = "#F5A623";

/** Text wordmark: "spoud" in brand blue, final "e" in brand gold — matches the logo. */
function SpoudeWordmark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="font-bold tracking-tight select-none"
      style={{ fontSize: size, lineHeight: 1 }}
    >
      <span style={{ color: SPOUDE_BLUE }}>spoud</span>
      <span style={{ color: SPOUDE_GOLD }}>e</span>
    </span>
  );
}

// Rotating expressive lines shown over the background image on desktop.
// Add / edit / reorder freely — they cycle automatically.
const EXPRESSIVE_LINES = [
  "Every late night with your notes counts for something.",
  "One page, one problem set, one step closer.",
  "You showed up today. That's not nothing.",
  "Quiet effort adds up to something loud.",
  "Somewhere between the coffee and the deadline, you're growing.",
  "Your future self is already proud of this.",
];

function useRotatingLine(lines: string[], intervalMs = 4500) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setVisible(true);
      }, 400);
      return () => clearTimeout(swap);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [lines.length, intervalMs]);

  return { line: lines[index], visible };
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [mfa, setMfa] = useState({ factorId: "", code: "" });
  const [resetSent, setResetSent] = useState(false);
  const { line, visible } = useRotatingLine(EXPRESSIVE_LINES);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = 0.7;
    // Try autoplay with sound first — most browsers block this unless the
    // visitor already has engagement with the site, so we fall back to
    // muted autoplay (always allowed) and let them tap the speaker to
    // turn sound on themselves.
    el.muted = false;
    el.play()
      .then(() => setSoundOn(true))
      .catch(() => {
        el.muted = true;
        setSoundOn(false);
        el.play().catch(() => {});
      });
  }, []);

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !soundOn;
    el.muted = !next;
    el.volume = 0.7;
    if (next) el.play().catch(() => {});
    setSoundOn(next);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/lumio", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/lumio`,
            data: { display_name: parsed.data.name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created! Check your email to confirm before signing in.");
          setMode("signin");
          return;
        }
        toast.success("Account created. Welcome to Spoude!");
        navigate({ to: "/lumio", replace: true });
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.[0];
          if (totp) {
            setMfa({ factorId: totp.id, code: "" });
            setStep("mfa");
            return;
          }
        }
        toast.success("Welcome back");
        navigate({ to: "/lumio", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfa.code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: mfa.factorId,
      });
      if (cErr) throw cErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfa.factorId,
        challengeId: challenge.id,
        code: mfa.code,
      });
      if (error) throw error;
      toast.success("Verified");
      navigate({ to: "/lumio", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/lumio", replace: true });
  };

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(form.email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      // Don't reveal whether the email exists — show success either way to avoid
      // leaking which addresses have accounts.
      setResetSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* LEFT — brand + photo + rotating expressive copy (desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/auth.mp4"
          autoPlay
          loop
          playsInline
          aria-hidden
        />
        {/* Darker overlay than a static photo needs — video brightness/motion draws the eye,
            so we push it down further to keep the logo and text readable. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(8,11,26,0.92) 0%, rgba(12,15,38,0.82) 45%, rgba(12,15,38,0.72) 100%)",
          }}
          aria-hidden
        />
        {/* Extra vignette so the corners (where the logo/text sit) are never washed out by a bright frame */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
          aria-hidden
        />

        {/* Sound toggle — browsers block unmuted autoplay on a fresh visit, so we try
            sound-on first and always give an explicit control either way. */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          className="absolute bottom-6 right-8 z-10 h-9 w-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Logo, top-left — text wordmark on a soft glass pill so it reads over the photo */}
        <div className="relative z-10 px-10 pt-10">
          <div className="inline-flex items-center rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-2.5 border border-white/20 shadow-lg">
            <SpoudeWordmark size={24} />
          </div>
        </div>

        {/* Rotating expressive line, bottom-left */}
        <div className="relative z-10 px-10 pb-14 max-w-md">
          <p
            className="text-[28px] leading-snug font-semibold text-white transition-opacity duration-400"
            style={{
              opacity: visible ? 1 : 0,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {line}
          </p>
          <div className="mt-6 flex items-center gap-4 text-[13px] text-white/70">
            <span>AI tutor</span>
            <span className="opacity-50">·</span>
            <span>Flashcards</span>
            <span className="opacity-50">·</span>
            <span>Timed exams</span>
          </div>
        </div>
      </div>

      {/* RIGHT — the auth form */}
      <div className="relative flex flex-1 flex-col min-h-screen lg:min-h-0">
        <div className="flex lg:hidden items-center px-6 pt-6">
          <SpoudeWordmark size={22} />
        </div>

        <main className="flex-1 flex items-center justify-center px-4 py-10 lg:py-0">
          <div className="w-full max-w-sm">
            <div className="mb-8 animate-fade-up">
              <h1 className="text-[26px] font-bold tracking-tight leading-tight">
                {mode === "signup"
                  ? "Create your Spoude account"
                  : mode === "forgot"
                    ? "Reset your password"
                    : "Welcome back to Spoude"}
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs">
                {mode === "signup"
                  ? "One quiet space for every note, homework and past paper."
                  : mode === "forgot"
                    ? "Enter the email on your account and we'll send you a reset link."
                    : "Sign in to continue where you left off."}
              </p>
            </div>

            <div
              className="rounded-3xl border border-border shadow-elev-3 p-6 sm:p-7 animate-fade-up"
              style={{ background: "var(--popover)", animationDelay: "60ms" }}
            >
              {step === "credentials" ? (
                mode === "forgot" ? (
                  resetSent ? (
                    <div className="text-center py-4">
                      <div className="h-11 w-11 rounded-2xl bg-primary-soft mx-auto flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <p className="mt-4 text-sm font-medium">Check your inbox</p>
                      <p className="mt-1 text-xs text-muted-foreground max-w-[220px] mx-auto">
                        If an account exists for <span className="text-foreground">{form.email}</span>, a reset link is on its way.
                      </p>
                      <button
                        onClick={() => { setMode("signin"); setResetSent(false); }}
                        className="mt-5 text-[13px] font-semibold text-primary hover:underline"
                      >
                        Back to sign in
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={sendResetEmail} className="space-y-3">
                      <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={255}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-transparent outline-none text-sm"
                          placeholder="you@school.edu"
                        />
                      </Field>
                      <button
                        type="submit"
                        disabled={loading}
                        className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Send reset link
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className="w-full text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors pt-1"
                      >
                        Back to sign in
                      </button>
                    </form>
                  )
                ) : (
                <>
                  <button
                    type="button"
                    onClick={google}
                    disabled={loading}
                    className="ripple w-full flex items-center justify-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-medium hover:border-primary/40 hover:shadow-elev-1 transition-all"
                  >
                    <GoogleIcon /> Continue with Google
                  </button>

                  <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    or email
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={submit} className="space-y-3">
                    {mode === "signup" && (
                      <Field label="Name" icon={<UserIcon className="h-4 w-4" />}>
                        <input
                          type="text"
                          autoComplete="name"
                          required
                          maxLength={80}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-transparent outline-none text-sm"
                          placeholder="Alex Rivera"
                        />
                      </Field>
                    )}
                    <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-transparent outline-none text-sm"
                        placeholder="you@school.edu"
                      />
                    </Field>
                    <div>
                      <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                        <input
                          type="password"
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          required
                          maxLength={72}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full bg-transparent outline-none text-sm"
                          placeholder={mode === "signup" ? "8+ chars, mixed case, number" : "••••••••"}
                        />
                      </Field>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => { setMode("forgot"); setResetSent(false); }}
                          className="mt-1.5 block ml-auto text-[11.5px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {mode === "signup" ? "Create account" : "Sign in"}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[13px] text-muted-foreground">
                    {mode === "signup" ? "Already have an account?" : "New to Spoude?"}{" "}
                    <button
                      onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                      className="text-foreground font-semibold hover:text-primary transition-colors"
                    >
                      {mode === "signup" ? "Sign in" : "Create one"}
                    </button>
                  </p>
                </>
                )
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold tracking-tight">Two-factor verification</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator.
                  </p>
                  <form onSubmit={verifyMfa} className="mt-5 space-y-3">
                    <input
                      autoFocus
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={mfa.code}
                      onChange={(e) =>
                        setMfa({ ...mfa, code: e.target.value.replace(/\D/g, "").slice(0, 6) })
                      }
                      className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-secondary rounded-lg py-3 outline-none focus:ring-2 focus:ring-ring"
                      placeholder="000000"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Verify
                    </button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-[11px] text-muted-foreground">
              By continuing you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms
              </Link>
              {" · "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2.5 rounded-xl border border-input bg-card/60 px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84A4.14 4.14 0 0112 13.55v2.27h2.92A8.77 8.77 0 0017.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
