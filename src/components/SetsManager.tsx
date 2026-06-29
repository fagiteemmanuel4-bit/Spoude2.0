import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateSet, getAiUsage } from "@/lib/sets.functions";
import { Sparkles, Loader2, Plus, X, Trash2, Play, Wand2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";

type Kind = "study" | "test" | "exam";

const KIND_META: Record<
  Kind,
  { title: string; subtitle: string; itemLabel: string; verb: string; defaultCount: number }
> = {
  study: {
    title: "Study",
    subtitle: "Flashcard decks to memorize fast.",
    itemLabel: "card",
    verb: "Study",
    defaultCount: 10,
  },
  test: {
    title: "Take a Test",
    subtitle: "Quick multiple-choice quizzes to check your understanding.",
    itemLabel: "question",
    verb: "Start test",
    defaultCount: 10,
  },
  exam: {
    title: "Take an Exam",
    subtitle: "Timed, full-length practice exams.",
    itemLabel: "question",
    verb: "Start exam",
    defaultCount: 20,
  },
};

type SetRow = {
  id: string;
  title: string;
  subject: string | null;
  questions: unknown[];
  ai_generated: boolean;
  created_at: string;
  time_limit_minutes: number | null;
};

export function SetsManager({ kind }: { kind: Kind }) {
  const meta = KIND_META[kind];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"none" | "ai" | "manual">("none");

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["sets", kind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sets")
        .select("id,title,subject,questions,ai_generated,created_at,time_limit_minutes")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SetRow[];
    },
  });

  const { data: usage } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getAiUsage(),
  });

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("study_sets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["sets", kind] });
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
          <p className="mt-1 text-muted-foreground">{meta.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("ai")}
            className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all"
          >
            <Wand2 className="h-4 w-4" /> Generate with AI
          </button>
          <button
            onClick={() => setMode("manual")}
            className="ripple inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40 transition-colors"
          >
            <PencilLine className="h-4 w-4" /> New manually
          </button>
        </div>
      </header>

      {usage && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            AI usage this month:{" "}
            <span className="text-foreground font-medium">
              {usage.used} / {usage.limit}
            </span>{" "}
            on the {PLANS[usage.plan].name} plan
          </span>
          <Link to="/billing" className="text-primary font-medium hover:underline">
            Manage plan →
          </Link>
        </div>
      )}

      {mode === "ai" && (
        <AiGenerator
          kind={kind}
          onClose={() => setMode("none")}
          onDone={(id) => navigate({ to: "/sets/$id", params: { id } })}
        />
      )}
      {mode === "manual" && (
        <ManualBuilder
          kind={kind}
          onClose={() => setMode("none")}
          onDone={() => qc.invalidateQueries({ queryKey: ["sets", kind] })}
        />
      )}

      {isLoading ? (
        <div className="surface p-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="surface p-12 text-center space-y-2">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nothing here yet — generate your first {meta.itemLabel} set with AI or build one manually.
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((s) => (
            <li key={s.id} className="surface-interactive p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{s.title}</h3>
                  {s.subject && <p className="text-xs text-muted-foreground mt-0.5">{s.subject}</p>}
                </div>
                {s.ai_generated && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-foreground">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {(s.questions as unknown[]).length} {meta.itemLabel}
                {(s.questions as unknown[]).length === 1 ? "" : "s"}
                {s.time_limit_minutes ? ` · ${s.time_limit_minutes} min` : ""}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to="/sets/$id"
                  params={{ id: s.id }}
                  className="ripple flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:shadow-glow transition-all"
                >
                  <Play className="h-3.5 w-3.5" /> {meta.verb}
                </Link>
                <button
                  onClick={() => remove(s.id, s.title)}
                  className="ripple inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AiGenerator({
  kind,
  onClose,
  onDone,
}: {
  kind: Kind;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const meta = KIND_META[kind];
  const qc = useQueryClient();
  const generate = useServerFn(generateSet);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(meta.defaultCount);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) return toast.error("Add a topic");
    setLoading(true);
    try {
      const res = await generate({
        data: { kind, topic: topic.trim(), subject: subject.trim() || undefined, count, difficulty },
      });
      toast.success(`Generated ${res.count} ${meta.itemLabel}s`);
      qc.invalidateQueries({ queryKey: ["sets", kind] });
      qc.invalidateQueries({ queryKey: ["ai-usage"] });
      onDone(res.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface p-6 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Generate with AI</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Photosynthesis — light reactions"
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject (optional)</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Biology"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">How many?</label>
          <input
            type="number"
            min={3}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(3, Math.min(50, Number(e.target.value) || 0)))}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating…" : `Generate ${count} ${meta.itemLabel}s`}
      </button>
    </form>
  );
}

type DraftItem = { prompt: string; choices: string[]; answer: string };

function ManualBuilder({
  kind,
  onClose,
  onDone,
}: {
  kind: Kind;
  onClose: () => void;
  onDone: () => void;
}) {
  const meta = KIND_META[kind];
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const blank = (): DraftItem =>
    kind === "study"
      ? { prompt: "", choices: [], answer: "" }
      : { prompt: "", choices: ["", "", "", ""], answer: "" };
  const [items, setItems] = useState<DraftItem[]>([blank()]);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<DraftItem>) =>
    setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const setChoice = (i: number, ci: number, value: string) =>
    setItems((xs) =>
      xs.map((x, idx) => (idx === i ? { ...x, choices: x.choices.map((c, j) => (j === ci ? value : c)) } : x)),
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Add a title");
    const cleaned = items
      .map((it) => ({
        prompt: it.prompt.trim(),
        choices: kind === "study" ? undefined : it.choices.map((c) => c.trim()).filter(Boolean),
        answer: it.answer.trim(),
      }))
      .filter((it) => it.prompt && it.answer && (kind === "study" || (it.choices && it.choices.length >= 2)));
    if (cleaned.length === 0) return toast.error("Add at least one complete question");

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return toast.error("Not signed in");
    }
    const { error } = await supabase.from("study_sets").insert({
      user_id: u.user.id,
      kind,
      title: title.trim().slice(0, 70),
      subject: subject.trim() || null,
      questions: cleaned,
      time_limit_minutes: kind === "exam" ? Math.max(10, cleaned.length * 2) : null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Set created");
    onDone();
    onClose();
  };

  return (
    <form onSubmit={save} className="surface p-6 space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilLine className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Build manually</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all"
        />
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2 bg-secondary/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {kind === "study" ? "Card" : "Question"} {i + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((xs) => xs.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input
              value={it.prompt}
              onChange={(e) => update(i, { prompt: e.target.value })}
              placeholder={kind === "study" ? "Front of card" : "Question"}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {kind === "study" ? (
              <input
                value={it.answer}
                onChange={(e) => update(i, { answer: e.target.value })}
                placeholder="Back of card"
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {it.choices.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`ans-${i}`}
                      checked={it.answer === c && c.length > 0}
                      onChange={() => update(i, { answer: c })}
                      className="accent-[var(--color-primary)]"
                    />
                    <input
                      value={c}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChoice(i, ci, v);
                        if (it.answer === c) update(i, { answer: v });
                      }}
                      placeholder={`Choice ${ci + 1}`}
                      className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((xs) => [...xs, blank()])}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Add {kind === "study" ? "card" : "question"}
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="ripple inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold shadow-elev-1 hover:shadow-glow transition-all disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save set
      </button>
    </form>
  );
}
