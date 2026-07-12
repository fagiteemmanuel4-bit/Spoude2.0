import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, X, BookOpen, FileText, GraduationCap, Loader2,
  Lock, Globe, Sparkles, Youtube, Library as LibraryIcon,
} from "lucide-react";

const TYPE_META = {
  notes: { label: "Notes", icon: BookOpen },
  homework: { label: "Homework", icon: FileText },
  exam: { label: "Past exams", icon: GraduationCap },
} as const;

export type LibrarySearchMaterial = {
  id: string;
  title: string;
  subject: string | null;
  type: "notes" | "homework" | "exam";
  file_name: string;
  mime_type: string | null;
};

export function LibrarySearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (m: LibrarySearchMaterial) => void;
}) {
  const [tab, setTab] = useState<"private" | "public">("private");
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTab("private");
      // Focus after the entrance animation starts so the keyboard/focus
      // ring doesn't fight the modal's fade-in.
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["materials-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id,title,subject,type,file_name,mime_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LibrarySearchMaterial[];
    },
    enabled: open,
  });

  const grouped = useMemo(() => {
    const t = q.trim().toLowerCase();
    const match = (m: LibrarySearchMaterial) =>
      !t ||
      m.title.toLowerCase().includes(t) ||
      (m.subject ?? "").toLowerCase().includes(t) ||
      m.file_name.toLowerCase().includes(t);
    const groups: Record<string, LibrarySearchMaterial[]> = { notes: [], homework: [], exam: [] };
    for (const m of items) if (match(m)) groups[m.type]?.push(m);
    return groups;
  }, [items, q]);

  const totalMatches = grouped.notes.length + grouped.homework.length + grouped.exam.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-up"
      />

      <div
        className="relative w-full sm:max-w-lg sm:mx-4 max-h-[85vh] sm:max-h-[80vh] rounded-t-[28px] sm:rounded-3xl border border-white/20 shadow-elev-3 flex flex-col overflow-hidden animate-fade-up"
        style={{
          background: "color-mix(in oklch, var(--popover) 78%, transparent)",
          backdropFilter: "blur(28px) saturate(180%)",
        }}
      >
        {/* Header: search field */}
        <div className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <LibraryIcon className="h-4 w-4 text-primary" /> Search library
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-input bg-card/70 px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-all">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, subject, or file name…"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-1.5">
            <TabButton active={tab === "private"} onClick={() => setTab("private")} icon={Lock} label="Private library" />
            <TabButton active={tab === "public"} onClick={() => setTab("public")} icon={Globe} label="Public library" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === "private" ? (
            isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : totalMatches === 0 ? (
              <div className="text-center py-14">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-sm font-medium">{q ? "No matches" : "Your library is empty"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {q ? "Try a different search term." : "Upload a document in Library to see it here."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {(["notes", "homework", "exam"] as const).map((type) => {
                  const list = grouped[type];
                  if (list.length === 0) return null;
                  const Icon = TYPE_META[type].icon;
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" /> {TYPE_META[type].label}
                        <span className="text-muted-foreground/60">· {list.length}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {list.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => onSelect(m)}
                            className="ripple text-left rounded-xl border border-border bg-card/70 p-3 hover:border-primary/40 hover:shadow-elev-1 transition-all"
                          >
                            <div className="text-[13px] font-medium truncate">{m.title}</div>
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {m.subject ?? m.file_name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <PublicComingSoon />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean; onClick: () => void; icon: typeof Lock; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-elev-1"
          : "bg-card/70 text-muted-foreground border border-border hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function PublicComingSoon() {
  return (
    <div className="text-center py-10">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 text-sm font-semibold">Public library — coming soon</p>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Notes, past papers, and exams shared by other students — plus videos and books from
        around the web — searchable in one place, right alongside your own library.
      </p>
      <div className="mt-4 flex items-center justify-center gap-3 text-muted-foreground/70">
        <Youtube className="h-4 w-4" />
        <BookOpen className="h-4 w-4" />
        <GraduationCap className="h-4 w-4" />
      </div>
    </div>
  );
}
