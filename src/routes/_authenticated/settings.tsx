import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Mail,
  User as UserIcon,
  Sparkles,
  Zap,
  CreditCard,
  ArrowRight,
  Volume2,
} from "lucide-react";
import { getUsage } from "@/lib/exam.functions";
import { deleteAccount } from "@/lib/account.functions";
import { planFor } from "@/lib/plans";
import {
  loadVoicePrefs,
  saveVoicePrefs,
  getVoices,
  type VoicePrefs,
  speakableText,
} from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Spoude" }] }),
=======
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Loader2, Mail, User as UserIcon, Sparkles, Zap, CreditCard, ArrowRight, Volume2 } from "lucide-react";
import { getUsage } from "@/lib/exam.functions";
import { planFor } from "@/lib/plans";
import { loadVoicePrefs, saveVoicePrefs, getVoices, type VoicePrefs, speakableText } from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Lumio" }] }),
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  component: Settings,
});

function AiUsageCard() {
  return InnerAiUsageCard();
}

function VoiceCard() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [prefs, setPrefs] = useState<VoicePrefs>(() => loadVoicePrefs());

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
<<<<<<< HEAD
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
=======
    return () => { window.speechSynthesis.onvoiceschanged = null; };
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  }, []);

  const update = (patch: Partial<VoicePrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveVoicePrefs(next);
  };

  const preview = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
<<<<<<< HEAD
    const u = new SpeechSynthesisUtterance(
      speakableText("Hello! I'll be your tutor on Spoude. Let's learn something together."),
    );
=======
    const u = new SpeechSynthesisUtterance(speakableText("Hello! I'll be your tutor on Lumio. Let's learn something together."));
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
    const v = voices.find((x) => x.voiceURI === prefs.voiceURI);
    if (v) u.voice = v;
    u.rate = prefs.rate;
    u.pitch = prefs.pitch;
    window.speechSynthesis.speak(u);
  };

  return (
    <section className="surface p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-primary" /> Voice & accent
      </h2>
<<<<<<< HEAD
      <p className="mt-1 text-sm text-muted-foreground">
        Pick the voice the Play button uses. Options come from your device — accents vary by OS.
      </p>
=======
      <p className="mt-1 text-sm text-muted-foreground">Pick the voice the Play button uses. Options come from your device — accents vary by OS.</p>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">Voice</span>
          <select
            value={prefs.voiceURI ?? ""}
            onChange={(e) => update({ voiceURI: e.target.value || null })}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
<<<<<<< HEAD
                {v.name} — {v.lang}
                {v.default ? " (default)" : ""}
=======
                {v.name} — {v.lang}{v.default ? " (default)" : ""}
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
<<<<<<< HEAD
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">
              Speed ({prefs.rate.toFixed(1)}x)
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={prefs.rate}
              onChange={(e) => update({ rate: Number(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">
              Pitch ({prefs.pitch.toFixed(1)})
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={prefs.pitch}
              onChange={(e) => update({ pitch: Number(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </label>
        </div>
      </div>
      <button
        onClick={preview}
        className="ripple mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40 transition-colors"
      >
        <Volume2 className="h-3.5 w-3.5" /> Preview
      </button>
      {voices.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          No voices detected yet — they load shortly after the page opens.
        </p>
=======
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Speed ({prefs.rate.toFixed(1)}x)</span>
            <input type="range" min={0.5} max={2} step={0.1} value={prefs.rate} onChange={(e) => update({ rate: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Pitch ({prefs.pitch.toFixed(1)})</span>
            <input type="range" min={0.5} max={2} step={0.1} value={prefs.pitch} onChange={(e) => update({ pitch: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
          </label>
        </div>
      </div>
      <button onClick={preview} className="ripple mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40 transition-colors">
        <Volume2 className="h-3.5 w-3.5" /> Preview
      </button>
      {voices.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">No voices detected yet — they load shortly after the page opens.</p>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
      )}
    </section>
  );
}

function InnerAiUsageCard() {
  const { data: usage, isLoading } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getUsage(),
  });
  const plan = planFor(usage?.plan);
  const pct =
    usage && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  return (
    <section className="surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> AI usage & plan
        </h2>
        <Link
          to="/billing"
          className="ripple inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
        >
          <CreditCard className="h-3.5 w-3.5" /> Manage billing <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
<<<<<<< HEAD
        You're on the <span className="text-foreground font-medium">{plan.name}</span> plan (
        {plan.price} {plan.priceNote}).
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">
          {isLoading ? "…" : (usage?.used ?? 0)}
=======
        You're on the <span className="text-foreground font-medium">{plan.name}</span> plan
        {" "}({plan.price} {plan.priceNote}).
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">
          {isLoading ? "…" : usage?.used ?? 0}
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
        </span>
        <span className="text-sm text-muted-foreground">
          / {usage?.limit ?? "—"} AI generations this month
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
<<<<<<< HEAD
        <div
          className="h-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
=======
        <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Resets on the 1st of each month.</p>
    </section>
  );
}

function Settings() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
<<<<<<< HEAD
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
=======
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  const [verifyCode, setVerifyCode] = useState("");
  const [loadingFactors, setLoadingFactors] = useState(true);

  const refreshFactors = async () => {
<<<<<<< HEAD
=======
    setLoadingFactors(true);
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setFactorId(verified?.id ?? null);
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
    setLoadingFactors(false);
  };

  useEffect(() => {
<<<<<<< HEAD
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email ?? "");
      setName(user.displayName ?? "");
    }
    refreshFactors();
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    let error: Error | null = null;
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      } else {
        throw new Error("No user authenticated");
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }
    setSavingName(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const startEnroll = async () => {
    toast.info("2FA is managed through your identity provider.");
=======
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.display_name as string | undefined) ?? "");
    });
    refreshFactors();
  }, []);


  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    setSavingName(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      // Clean up any unverified factors first
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.totp ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Lumio TOTP" });
      if (error) throw error;
      setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start enrollment");
    } finally {
      setEnrolling(false);
    }
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
  };

  const disable = async () => {
    toast.info("2FA is managed through your identity provider.");
=======
    if (!enrollData) return;
    if (verifyCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setEnrolling(true);
    try {
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
      if (cErr) throw cErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: ch.id,
        code: verifyCode,
      });
      if (error) throw error;
      toast.success("Two-factor authentication enabled");
      setEnrollData(null);
      setVerifyCode("");
      await refreshFactors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setEnrolling(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    if (!confirm("Turn off two-factor authentication?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { toast.error(error.message); return; }
    toast.success("Two-factor authentication disabled");
    await refreshFactors();
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-up">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and security.</p>
      </header>

      <AiUsageCard />
      <VoiceCard />

      {/* Profile */}
      <section className="surface p-6">
<<<<<<< HEAD
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" /> Profile
        </h2>
=======
        <h2 className="text-lg font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Profile</h2>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
        <form onSubmit={saveName} className="mt-4 space-y-4">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Email</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
          <div>
<<<<<<< HEAD
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">
              Display name
            </span>
=======
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Display name</span>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
          >
            {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </form>
      </section>

      {/* Security */}
      <section className="surface p-6">
<<<<<<< HEAD
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an extra layer of security with an authenticator app (Authy, 1Password, Google
          Authenticator…).
=======
        <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an extra layer of security with an authenticator app (Authy, 1Password, Google Authenticator…).
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
        </p>

        <div className="mt-5">
          {loadingFactors ? (
<<<<<<< HEAD
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
=======
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
          ) : factorId ? (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-primary-soft px-4 py-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">2FA is enabled</div>
<<<<<<< HEAD
                  <div className="text-xs text-muted-foreground">
                    You'll be asked for a code at sign-in.
                  </div>
=======
                  <div className="text-xs text-muted-foreground">You'll be asked for a code at sign-in.</div>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
                </div>
              </div>
              <button
                onClick={disable}
                className="ripple inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-destructive/40 hover:text-destructive transition-colors"
              >
                <ShieldOff className="h-3.5 w-3.5" /> Disable
              </button>
            </div>
          ) : enrollData ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row items-center gap-5">
<<<<<<< HEAD
                <img
                  src={enrollData.qr}
                  alt="Scan with your authenticator app"
                  className="h-40 w-40 rounded-md bg-white p-2"
                />
                <div className="flex-1 text-sm">
                  <p className="text-muted-foreground">
                    Scan with your authenticator app, or enter this secret manually:
                  </p>
                  <code className="mt-2 block text-xs bg-secondary rounded px-2 py-1.5 break-all font-mono">
                    {enrollData.secret}
                  </code>
=======
                <img src={enrollData.qr} alt="Scan with your authenticator app" className="h-40 w-40 rounded-md bg-white p-2" />
                <div className="flex-1 text-sm">
                  <p className="text-muted-foreground">Scan with your authenticator app, or enter this secret manually:</p>
                  <code className="mt-2 block text-xs bg-secondary rounded px-2 py-1.5 break-all font-mono">{enrollData.secret}</code>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
                </div>
              </div>
              <form onSubmit={confirmEnroll} className="flex flex-col sm:flex-row gap-3">
                <input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-mono tracking-widest text-center outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
                />
                <button
                  type="submit"
                  disabled={enrolling}
                  className="ripple inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {enrolling && <Loader2 className="h-4 w-4 animate-spin" />} Verify & enable
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={startEnroll}
              disabled={enrolling}
              className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
            >
<<<<<<< HEAD
              {enrolling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}{" "}
              Set up 2FA
=======
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Set up 2FA
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
            </button>
          )}
        </div>
      </section>

      <section className="surface p-6 border-dashed">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Coming soon</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold">Backup codes & passkeys</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time recovery codes and passkey support are on the way.
        </p>
      </section>
<<<<<<< HEAD

      <DeleteAccountSection />
    </div>
  );
}

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.trim().toLowerCase() !== "delete") {
      toast.error('Type "delete" to confirm');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete account");
      setDeleting(false);
    }
  };

  return (
    <section className="surface p-6 border-destructive/30">
      <h2 className="text-lg font-semibold text-destructive">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This permanently deletes your account, your library, and everything you've uploaded. This
        cannot be undone.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-destructive/40 text-destructive px-4 py-2.5 text-sm font-semibold hover:bg-destructive/10 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3 max-w-sm">
          <p className="text-sm">
            Type <span className="font-mono font-semibold">delete</span> to confirm.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg border border-input bg-card/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/40"
            placeholder="delete"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Permanently delete
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmText("");
              }}
              className="rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
=======
    </div>
  );
}
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
