import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, FolderOpen, BookOpenCheck, GraduationCap, User,
  ArrowRight, ArrowLeft, X, Sparkles, Check,
} from "lucide-react";
import { SpoudeMark } from "@/components/Logo";

const KEY = "spoude-onboarding-v2";

export function shouldRunOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) !== "done"; } catch { return true; }
}

export function resetOnboarding() {
  try { localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event("spoude:onboarding:replay"));
}

type TourStep = {
  path: "/lumio" | "/library" | "/study" | "/exams" | "/profile";
  title: string;
  desc: string;
  icon: typeof Home;
  tone: "primary" | "gold" | "violet" | "emerald";
  /** Where to visually anchor the card relative to the screen, since each
   *  section has different content in different places. */
  anchor: "center" | "bottom";
};

const TOUR: TourStep[] = [
  {
    path: "/lumio",
    title: "Home — your daily starting point",
    desc: "Your streak, honor score, and quick-jump tiles land here. This is where you'll check in every time you open Spoude.",
    icon: Home,
    tone: "primary",
    anchor: "center",
  },
  {
    path: "/library",
    title: "Library — everything you've uploaded",
    desc: "Notes, homework, and past exams live here, organized by type. Upload something new any time with the button up top.",
    icon: FolderOpen,
    tone: "violet",
    anchor: "bottom",
  },
  {
    path: "/study",
    title: "Study — an AI tutor that adapts to you",
    desc: "Pick a document from your library, choose a teaching style, and get a guided lesson built from your own material.",
    icon: BookOpenCheck,
    tone: "gold",
    anchor: "bottom",
  },
  {
    path: "/exams",
    title: "Exams — practice under real conditions",
    desc: "Timed, graded practice exams pulled from your own documents. Good for the week before the real thing.",
    icon: GraduationCap,
    tone: "emerald",
    anchor: "bottom",
  },
  {
    path: "/profile",
    title: "Profile — your progress & account",
    desc: "Streak history, honor score, plan, and account settings all live here. You can replay this tour any time from Settings.",
    icon: User,
    tone: "primary",
    anchor: "center",
  },
];

export function Onboarding() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (shouldRunOnboarding()) {
      setActive(true);
      setStep(0);
    }
    const replay = () => { setActive(true); setStep(0); };
    window.addEventListener("spoude:onboarding:replay", replay);
    return () => window.removeEventListener("spoude:onboarding:replay", replay);
  }, []);

  // Keep the app actually navigated to whichever section the current tour
  // step is talking about.
  useEffect(() => {
    if (!active) return;
    const target = TOUR[step]?.path;
    if (target && pathname !== target) {
      navigate({ to: target });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  const finish = () => {
    try { localStorage.setItem(KEY, "done"); } catch {}
    setActive(false);
  };

  const next = () => {
    if (step < TOUR.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  if (typeof document === "undefined" || !active) return null;

  const current = TOUR[step];
  const isLast = step === TOUR.length - 1;

  return createPortal(
    <TourCard
      step={step}
      total={TOUR.length}
      data={current}
      isLast={isLast}
      onNext={next}
      onBack={step > 0 ? back : undefined}
      onSkip={finish}
    />,
    document.body,
  );
}

function TourCard({
  step, total, data, isLast, onNext, onBack, onSkip,
}: {
  step: number;
  total: number;
  data: TourStep;
  isLast: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}) {
  const Icon = data.icon;
  const toneCls: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    gold: "bg-amber-400/15 text-amber-500 dark:text-amber-300",
    violet: "bg-violet-500/15 text-violet-500 dark:text-violet-300",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  };

  const positionCls =
    data.anchor === "center"
      ? "items-center justify-center p-4"
      : "items-end sm:items-center justify-center p-4 pb-24 sm:pb-4";

  return (
    <div className={`fixed inset-0 z-[110] flex ${positionCls} animate-fade-up`}>
      <button
        aria-label="Skip tour"
        onClick={onSkip}
        className="absolute inset-0 bg-foreground/60 backdrop-blur-md"
      />
      <div
        key={step}
        className="relative w-full max-w-sm p-6 rounded-3xl border border-border shadow-elev-3 animate-fade-up"
        style={{ background: "var(--popover)", color: "var(--popover-foreground)" }}
      >
        <button
          onClick={onSkip}
          aria-label="Skip tour"
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            {step === 0 && <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-lg animate-shimmer" />}
            <div className={`relative h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${toneCls[data.tone]}`}>
              {step === 0 ? <SpoudeMark size={22} /> : <Icon className="h-5 w-5" />}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Step {step + 1} of {total}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold tracking-tight leading-snug">{data.title}</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{data.desc}</p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-[12px] font-medium hover:border-primary/40 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <button
              onClick={onNext}
              className="ripple inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[12px] font-semibold shadow-elev-1 hover:shadow-glow transition-all"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Finish
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
