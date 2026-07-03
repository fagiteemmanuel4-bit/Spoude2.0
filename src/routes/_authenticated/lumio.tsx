import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpenCheck,
  GraduationCap,
  FolderOpen,
  LayoutDashboard,
  Sparkles,
  Timer,
  Flame,
  Brain,
  Volume2,
  Wand2,
  Layers,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/lumio")({
  head: () => ({ meta: [{ title: "Home — Lumio" }] }),
  component: HomePage,
});

type Tile = {
  to?: "/study" | "/exams" | "/library" | "/dashboard" | "/billing";
  label: string;
  desc: string;
  icon: typeof BookOpenCheck;
  accent?: "primary" | "gold" | "violet" | "emerald" | "rose";
  soon?: boolean;
};

const PRIMARY: Tile[] = [
  { to: "/study", label: "Study mode", desc: "AI lessons, flashcards & deep dives.", icon: BookOpenCheck, accent: "primary" },
  { to: "/exams", label: "Take an exam", desc: "Timed practice with instant grading.", icon: GraduationCap, accent: "violet" },
  { to: "/library", label: "Library", desc: "Upload notes, homework & past papers.", icon: FolderOpen, accent: "emerald" },
  { to: "/dashboard", label: "Progress", desc: "Streaks, scores & AI usage.", icon: LayoutDashboard, accent: "gold" },
];

const LEARN_MORE: Tile[] = [
  { to: "/study", label: "AI tutor chat", desc: "Ask anything, get taught step-by-step.", icon: Sparkles, accent: "primary" },
  { to: "/study", label: "Flashcard decks", desc: "Auto-generated from your material.", icon: Layers, accent: "violet" },
  { to: "/study", label: "Read aloud", desc: "Listen to lessons hands-free.", icon: Volume2, accent: "emerald" },
  { label: "Focus timer", desc: "Pomodoro sessions that award honor.", icon: Timer, soon: true, accent: "rose" },
  { label: "Daily challenge", desc: "One curated question every day.", icon: Flame, soon: true, accent: "gold" },
  { label: "Concept explainer", desc: "Break any topic into simple parts.", icon: Brain, soon: true, accent: "primary" },
];

function HomePage() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const name =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Hi, <span className="text-gradient-warm">{name}</span>.
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Pick how you want to learn today.
        </p>
      </header>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Jump in
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PRIMARY.map((t) => <TileCard key={t.label} tile={t} big />)}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          More ways to learn
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEARN_MORE.map((t) => <TileCard key={t.label} tile={t} />)}
        </div>
      </section>

      <section className="surface p-6 border-dashed">
        <div className="flex items-center gap-2 text-primary">
          <Wand2 className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">Tip</span>
        </div>
        <h3 className="mt-2 font-semibold">Upload a file, get a full study kit</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a PDF into your library and Lumio will build lessons, flashcards, and exams from it.
        </p>
        <Link
          to="/library"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Open library <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

const ACCENT: Record<NonNullable<Tile["accent"]>, string> = {
  primary: "bg-primary/15 text-primary",
  gold: "bg-amber-400/15 text-amber-300",
  violet: "bg-violet-500/15 text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  rose: "bg-rose-500/15 text-rose-300",
};

function TileCard({ tile, big = false }: { tile: Tile; big?: boolean }) {
  const Icon = tile.icon;
  const accent = ACCENT[tile.accent ?? "primary"];
  const body = (
    <>
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {tile.soon ? (
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
            Soon
          </span>
        ) : (
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <h3 className={`mt-4 font-semibold ${big ? "text-sm" : "text-sm"}`}>{tile.label}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tile.desc}</p>
    </>
  );
  const cls = `surface-interactive p-4 sm:p-5 block group ${tile.soon ? "opacity-70 cursor-not-allowed" : ""}`;
  if (!tile.to || tile.soon) return <div className={cls}>{body}</div>;
  return (
    <Link to={tile.to} className={cls}>
      {body}
    </Link>
  );
}