import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  BookOpen,
  GraduationCap,
  FolderOpen,
  Zap,
  HelpCircle,
  Compass,
  ArrowLeft,
  ChevronRight,
  Triangle,
  Circle,
  FileText,
  MousePointerClick,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help & Docs — Spoude" }] }),
  component: HelpCenterPage,
});

interface Article {
  id: string;
  category: "getting-started" | "study" | "exams" | "library" | "monetization";
  title: string;
  content: string;
  keywords: string[];
}

const CATEGORIES = [
  { id: "all", label: "All Docs", icon: HelpCircle },
  { id: "getting-started", label: "Getting Started", icon: Compass },
  { id: "study", label: "Study Mode", icon: BookOpen },
  { id: "exams", label: "Exams & Tests", icon: GraduationCap },
  { id: "library", label: "Public Library", icon: FolderOpen },
  { id: "monetization", label: "Energy & Passes", icon: Zap },
] as const;

const ARTICLES: Article[] = [
  {
    id: "navigating-spoude",
    category: "getting-started",
    title: "Navigating Spoude Study Studio",
    content:
      "Spoude is structured into three main sectors to optimize your cognitive bandwidth: the Home Hub, your private Library, and Study Mode. The sidebar on desktop or the glowing plus (+) menu at the bottom center of your mobile screen serves as your main navigation system. Tap Home to review your current study streak, global exam scores, and remaining AI credits.",
    keywords: ["navigate", "sidebar", "mobile", "plus", "home", "hub"],
  },
  {
    id: "smart-onboarding",
    category: "getting-started",
    title: "Personalizing Your Smart Preferences",
    content:
      "During your first session, Spoude runs a customized preference checkup covering your academic grade, topics of focus, and tutorial style. This feeds directly into our OpenRouter AI models so lessons adjust automatically: if you chose Socratic style, the AI professor will guide you step-by-step; if direct style is selected, it outputs concise, fast-paced bullet points.",
    keywords: ["onboarding", "preferences", "socratic", "style", "personalization"],
  },
  {
    id: "study-lessons",
    category: "study",
    title: "How to Generate Interactive Lessons",
    content:
      "To trigger a structured study lesson, head to the Study Mode section, choose any document from your library, and choose one of our verified academic teaching styles. The AI tutor digests the text and generates custom structured lessons page-by-page. Tap 'Continue - go deeper' to generate next-level conceptual formulas, worked examples, and edge cases.",
    keywords: ["study", "lessons", "tutor", "prof", "teaching", "style"],
  },
  {
    id: "voice-assistant",
    category: "study",
    title: "Read Aloud Walkthroughs",
    content:
      "Want to learn hands-free? Spoude embeds an high-quality Web Speech Walkthrough engine. Inside any active lesson, click the speaker icon next to the lesson header to hear the text read aloud naturally. You can toggle between male and female standard vocal rate settings inside your account Settings page.",
    keywords: ["speak", "voice", "read", "audio", "walkthrough", "tts"],
  },
  {
    id: "exams-practice",
    category: "exams",
    title: "Acing Timed Practice Exams",
    content:
      "Generate exam prep documents straight from study notes! Under Exams, specify the number of multiple-choice questions you want (up to 50). Spoude's Gemini nodes build a distraction-free exam room. Exams launch in full-screen focus mode with a clear timer, progress bar, and instant auto-grading upon completion.",
    keywords: ["exam", "test", "quiz", "timed", "mock", "practice"],
  },
  {
    id: "public-library-uploads",
    category: "library",
    title: "Sharing on the Public Library",
    content:
      "Knowledge is better when shared! Use the 'Upload to Library' button inside Spoude Library to share high-quality textbook companions or class reviews. Every document uploaded officially passes through academic integrity checks. Items uploaded by vetted universities or admins are automatically marked with a blue VERIFIED badge.",
    keywords: ["share", "upload", "verified", "school", "university", "library"],
  },
  {
    id: "energy-charges",
    category: "monetization",
    title: "Understanding the Energy System",
    content:
      "To support LLM processing costs fairly, Spoude implements an Energy budget. Standard student accounts receive 10 free Energy credits daily (resets every morning, does not roll over). Reading notes or checking study streaks is always free. Timed mock exams cost 10 Energy, AI explanations cost 2 Energy, and generating flashcard sets costs 5 Energy.",
    keywords: ["energy", "credits", "free", "charges", "cost", "tokens"],
  },
  {
    id: "premium-passes",
    category: "monetization",
    title: "Purchasing Premium Passes & Packs",
    content:
      "If you run out of energy, top up using our secure Flutterwave payment portal. Spark Pack (₦200) grants 30 Energy, Boost Pack (₦500) grants 100 Energy. Standard Passes (₦1,500 for 3 months) provide 500 Energy upfront, while Premium Season Passes (₦3,000 for 3 months) unlock unlimited mock tests and soft caps of 200 tutoring walkthroughs.",
    keywords: ["buy", "purchase", "pro", "pass", "flutterwave", "flw", "pricing"],
  },
];

function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveTab] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filtered = ARTICLES.filter((art) => {
    const matchesCategory = activeCategory === "all" || art.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.keywords.some((k) => k.includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-20 relative">
      {/* Geometric Decorative Accent Elements (Phase 8 Requirement) */}
      <div className="absolute top-4 right-10 w-20 h-24 text-primary/5 pointer-events-none">
        <Triangle className="w-16 h-16 stroke-[1.5] fill-current" />
      </div>
      <div className="absolute bottom-16 left-6 w-24 h-24 text-indigo-500/5 pointer-events-none">
        <Circle className="w-20 h-20 fill-current" />
      </div>

      {/* Header */}
      <header className="glass p-8 rounded-[32px] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Geometric accent bg circle */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest">
            <Info className="h-3.5 w-3.5" /> Documentation Node
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Help Center & Docs</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Find structured, categorized solutions and learn how to master Spoude's premium learning
            tools.
          </p>
        </div>

        {/* Real-time fuzzy search input */}
        <div className="relative w-full max-w-xs shrink-0 group z-10">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedArticle(null); // Clear active read to show list on search edit
            }}
            placeholder="Search keywords, subjects, tutors..."
            className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </header>

      {/* Categories Bar */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-1 whitespace-nowrap">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSelectedArticle(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Articles list */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            Articles ({filtered.length})
          </h3>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 px-1">
              No guides found matching this criteria.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span className="text-xs font-bold leading-relaxed">{art.title}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active article viewport */}
        <div className="md:col-span-2">
          {selectedArticle ? (
            <article className="glass p-6 sm:p-8 rounded-[32px] border border-border animate-fade-up space-y-4">
              <button
                onClick={() => setSelectedArticle(null)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to guides list
              </button>
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {selectedArticle.category.replace("-", " ")}
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">{selectedArticle.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 pt-2 whitespace-pre-line">
                {selectedArticle.content}
              </p>
              <div className="pt-4 border-t border-border/50 flex flex-wrap gap-1.5">
                {selectedArticle.keywords.map((k) => (
                  <span
                    key={k}
                    className="text-[10px] bg-secondary text-muted-foreground px-2 py-1 rounded"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </article>
          ) : (
            <div className="glass p-12 rounded-[32px] text-center border border-dashed border-border flex flex-col items-center justify-center space-y-4">
              <MousePointerClick className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <h4 className="font-bold text-base">Select a documentation guide</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Click on any listed article on the left to read its complete visual details and
                  walkthrough tips.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
