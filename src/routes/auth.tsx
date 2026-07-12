import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  updatePassword,
  updateProfile,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendVerificationCode, verifyCode } from "@/lib/account.functions";
import { SpoudeWordmark } from "@/components/Logo";
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

const googleProvider = new GoogleAuthProvider();

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
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

type Step = "credentials" | "verify_signup" | "forgot" | "reset_verify";

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
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { line, visible } = useRotatingLine(EXPRESSIVE_LINES);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = 0.7;
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
    if (auth.currentUser) navigate({ to: "/spoude", replace: true });
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
        const cred = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
        await updateProfile(cred.user, { displayName: parsed.data.name });
        await setDoc(doc(db, "profiles", cred.user.uid), {
          display_name: parsed.data.name,
          role: "student",
          plan: "free",
          created_at: new Date().toISOString(),
        });
        await sendVerificationCode("signup");
        toast.success("We've emailed you a 6-digit code.");
        setStep("verify_signup");
      } else {
        const parsed = signinSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
        toast.success("Welcome back");
        navigate({ to: "/spoude", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmSignupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await verifyCode("signup", code);
      toast.success("Account verified. Welcome to Spoude!");
      navigate({ to: "/spoude", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const requestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(form.email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await sendVerificationCode("reset_password", parsed.data);
      toast.success("If that email has an account, a code is on its way.");
      setStep("reset_verify");
    } finally {
      setLoading(false);
    }
  };

  const confirmResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    const parsed = z
      .string()
      .min(8, "At least 8 characters")
      .max(72)
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/\d/, "Add a number")
      .safeParse(newPassword);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const result = await verifyCode("reset_password", code, form.email);
      if (!result.customToken) throw new Error("Verification failed");
      await signInWithCustomToken(auth, result.customToken);
      if (auth.currentUser) await updatePassword(auth.currentUser, parsed.data);
      toast.success("Password updated. Welcome back!");
      navigate({ to: "/spoude", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back");
      navigate({ to: "/spoude", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
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
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(8,11,26,0.92) 0%, rgba(12,15,38,0.82) 45%, rgba(12,15,38,0.72) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
          aria-hidden
        />

        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          className="absolute bottom-6 right-8 z-10 h-9 w-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <div className="relative z-10 px-10 pt-10">
          <div className="inline-flex items-center rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-2.5 border border-white/20 shadow-lg">
            <SpoudeWordmark size={24} />
          </div>
        </div>

        <div className="relative z-10 px-10 pb-14 max-w-md">
          <p
            className="text-[28px] leading-snug font-semibold text-white transition-opacity duration-400"
            style={{ opacity: visible ? 1 : 0, fontFamily: "Georgia, 'Times New Roman', serif" }}
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

      <div className="relative flex flex-1 flex-col min-h-screen lg:min-h-0">
        <div className="flex lg:hidden items-center px-6 pt-6">
          <SpoudeWordmark size={22} />
        </div>

        <main className="flex-1 flex items-center justify-center px-4 py-10 lg:py-0">
          <div className="w-full max-w-sm">
            <div className="mb-8 animate-fade-up">
              <h1 className="text-[26px] font-bold tracking-tight leading-tight">
                {step === "verify_signup"
                  ? "Check your email"
                  : step === "forgot" || step === "reset_verify"
                    ? "Reset your password"
                    : mode === "signup"
                      ? "Create your Spoude account"
                      : "Welcome back to Spoude"}
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xs">
                {step === "verify_signup"
                  ? `We've sent a 6-digit code to ${form.email}.`
                  : step === "forgot"
                    ? "Enter the email on your account and we'll send you a code."
                    : step === "reset_verify"
                      ? `Enter the code we sent to ${form.email}, and choose a new password.`
                      : mode === "signup"
                        ? "One quiet space for every note, homework and past paper."
                        : "Sign in to continue where you left off."}
              </p>
            </div>

            <div
              className="rounded-3xl border border-border shadow-elev-3 p-6 sm:p-7 animate-fade-up"
              style={{ background: "var(--popover)", animationDelay: "60ms" }}
            >
              {step === "credentials" && (
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
                          onClick={() => setStep("forgot")}
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
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
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
              )}

              {step === "verify_signup" && (
                <form onSubmit={confirmSignupCode} className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-secondary rounded-lg py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="000000"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verify & continue
                  </button>
                </form>
              )}

              {step === "forgot" && (
                <form onSubmit={requestResetCode} className="space-y-3">
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
                    Send code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-full text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors pt-1"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {step === "reset_verify" && (
                <form onSubmit={confirmResetCode} className="space-y-3">
                  <input
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-secondary rounded-lg py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="000000"
                  />
                  <Field label="New password" icon={<Lock className="h-4 w-4" />}>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      maxLength={72}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="8+ chars, mixed case, number"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ripple w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-[13px] font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Set new password
                  </button>
                </form>
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
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84A4.14 4.14 0 0112 13.55v2.27h2.92A8.77 8.77 0 0017.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853" />
      <path d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
