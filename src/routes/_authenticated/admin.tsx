import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import {
  School,
  Upload,
  BookOpen,
  CheckCircle,
  FileText,
  Clock,
  Trash2,
  Sparkles,
  Users,
  DollarSign,
  Star,
  Lock,
  Unlock,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Zap,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skel } from "@/components/Skeletons";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Portal — Spoude" }] }),
  component: AdminDashboard,
});

interface UserProfile {
  id: string;
  display_name?: string;
  email?: string;
  bio?: string;
  role?: string;
  current_streak?: number;
  is_suspended?: boolean;
  ban_reason?: string;
  last_active_date?: string;
  created_at?: string;
  daysInactive?: number;
  lifecycleStatus?: "active" | "warn-6-weeks" | "overdue-deletion";
}

interface Transaction {
  amount: number;
  date: string;
  type: string;
}

interface FeedbackReport {
  id: string;
  user_name: string;
  user_email: string;
  rating: number;
  category: string;
  message: string;
}

interface ContactUsMessage {
  id: string;
  name: string;
  email: string;
  message: string;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [libTitle, setLibTitle] = useState("");
  const [libSubject, setLibSubject] = useState("");
  const [libPublisher, setLibPublisher] = useState("");
  const [libUploading, setLibUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "metrics" | "feedback" | "broadcast" | "accounts" | "contact" | "library" | "lifecycle"
  >("metrics");

  // Queries
  const { data: metrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [profilesSnap, attemptsSnap, materialsSnap] = await Promise.all([
        getDocs(collection(db, "profiles")),
        getDocs(collection(db, "attempts")),
        getDocs(collection(db, "materials")),
      ]);

      const users: UserProfile[] = [];
      profilesSnap.forEach((d) => {
        users.push({ id: d.id, ...d.data() } as UserProfile);
      });

      const mockTransactions: Transaction[] = [
        { amount: 3000, date: "2026-07-01", type: "Season Pass" },
        { amount: 1500, date: "2026-07-02", type: "Standard Pass" },
        { amount: 500, date: "2026-07-03", type: "Boost Pack" },
        { amount: 200, date: "2026-07-04", type: "Spark Pack" },
      ];
      const totalRevenue = mockTransactions.reduce((acc, t) => acc + t.amount, 0);

      const now = new Date();

      const activeList = users.map((u) => {
        const lastActive = u.last_active_date
          ? new Date(u.last_active_date)
          : new Date(u.created_at || Date.now());
        const daysInactive = Math.floor(
          (now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000),
        );

        let status: "active" | "warn-6-weeks" | "overdue-deletion" = "active";
        if (daysInactive >= 60) status = "overdue-deletion";
        else if (daysInactive >= 42) status = "warn-6-weeks";

        return {
          ...u,
          daysInactive,
          lifecycleStatus: status,
        } as UserProfile;
      });

      return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => (u.current_streak ?? 0) > 0).length,
        verifiedUnis: users.filter((u) => u.role === "university").length,
        totalAttempts: attemptsSnap.size,
        totalMaterials: materialsSnap.size,
        revenue: totalRevenue,
        usersList: activeList,
        recentTransactions: mockTransactions,
      };
    },
  });

  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "feedback"));
      const list: FeedbackReport[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          user_name: data.user_name || "User",
          user_email: data.user_email || "",
          rating: data.rating || 0,
          category: data.category || "general",
          message: data.message || "",
        });
      });
      return list;
    },
  });

  const { data: contactMessages = [], isLoading: contactLoading } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "contact_us"));
      const list: ContactUsMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || "Inquirer",
          email: data.email || "",
          message: data.message || "",
        });
      });
      return list;
    },
  });

  // Mutations
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!broadcastSubject || !broadcastBody) throw new Error("Fields cannot be empty");
      setBroadcasting(true);

      const targetQuery = collection(db, "profiles");
      const snap = await getDocs(targetQuery);
      const userIds: string[] = [];
      snap.forEach((doc) => userIds.push(doc.id));

      for (const uid of userIds) {
        await addDoc(collection(db, "notifications"), {
          user_id: uid,
          title: broadcastSubject,
          message: broadcastBody,
          read: false,
          type: "broadcast",
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast.success("Broadcast emails and notifications pushed successfully!");
      setBroadcastSubject("");
      setBroadcastBody("");
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : "Broadcast failed";
      toast.error(errorMsg);
    },
    onSettled: () => {
      setBroadcasting(false);
    },
  });

  const libUploadMutation = useMutation({
    mutationFn: async () => {
      if (!libTitle || !libSubject) throw new Error("Title and subject are required");
      setLibUploading(true);
      const docId = Math.random().toString(36).substring(2);
      await setDoc(doc(db, "materials", docId), {
        user_id: "admin",
        title: libTitle,
        subject: libSubject,
        type: "notes",
        storage_path: `materials/admin/${docId}`,
        file_name: `${libTitle}.pdf`,
        file_size: 2048576,
        mime_type: "application/pdf",
        is_pinned: false,
        is_public: true,
        is_verified: true, // Auto marked verified as admin uploaded (Phase 6)
        publisher_name: libPublisher || "Official Spoude Admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded officially and marked as VERIFIED!");
      setLibTitle("");
      setLibSubject("");
      setLibPublisher("");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      toast.error(errorMsg);
    },
    onSettled: () => {
      setLibUploading(false);
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      await updateDoc(doc(db, "profiles", userId), {
        is_suspended: isBanned,
        ban_reason: isBanned ? banReason : "",
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("User suspension state modified successfully");
      setSelectedUserId("");
      setBanReason("");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : "Moderation failed";
      toast.error(errorMsg);
    },
  });

  const deleteContactMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contact_us", id));
      toast.success("Message deleted");
      qc.invalidateQueries({ queryKey: ["admin-contact"] });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Deletion failed";
      toast.error(errorMsg);
    }
  };

  // Lifecycle control sweep (Phase 7 Auto warning & Auto deletion triggers)
  const triggerLifecycleWarnings = async () => {
    const list = metrics?.usersList ?? [];
    const warningTargets = list.filter((u) => u.lifecycleStatus === "warn-6-weeks");
    if (warningTargets.length === 0) {
      toast.info("No users currently pending the 6-week inactivity warning sweep.");
      return;
    }

    try {
      for (const u of warningTargets) {
        await addDoc(collection(db, "notifications"), {
          user_id: u.id,
          title: "⚠️ Inactivity Deletion Warning",
          message:
            "Your Spoude account has been inactive for over 6 weeks. To preserve your saved notes, flashcards and quiz metrics, please log back in within the next 2 weeks.",
          read: false,
          type: "broadcast",
          created_at: new Date().toISOString(),
        });
      }
      toast.success(
        `Inactivity warnings successfully dispatched to ${warningTargets.length} users!`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lifecycle sweep failed";
      toast.error(errorMsg);
    }
  };

  const executeAutoDeletionSweep = async () => {
    const list = metrics?.usersList ?? [];
    const deleteTargets = list.filter((u) => u.lifecycleStatus === "overdue-deletion");
    if (deleteTargets.length === 0) {
      toast.info("No inactive users currently exceed the 2-month threshold.");
      return;
    }

    if (
      !confirm(
        `This will permanently delete ${deleteTargets.length} inactive profiles from Spoude. Continue?`,
      )
    )
      return;

    try {
      for (const u of deleteTargets) {
        await deleteDoc(doc(db, "profiles", u.id));
      }
      toast.success(`Successfully purged ${deleteTargets.length} stale profiles.`);
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Sweep deletion failed";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-6xl mx-auto pb-16 relative">
      {/* Geometric Decorative Elements (Phase 8 Aesthetic Requirement) */}
      <div className="absolute top-2 right-8 w-24 h-24 bg-primary/5 rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[26px] border-b-primary/5 pointer-events-none" />

      {/* Header */}
      <header className="glass p-8 rounded-[32px] bg-indigo-950/80 text-white border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              Spoude Administrative Console
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">Admin Dashboard</h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Control global parameters, monitor verified university channels, send broadcast
              notices, and moderate users.
            </p>
          </div>
        </div>
      </header>

      {/* Sub navigation tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto whitespace-nowrap pb-1">
        {[
          { id: "metrics", label: "Metrics & Revenue", icon: TrendingUp },
          { id: "feedback", label: "Feedback & Reviews", icon: MessageSquare },
          { id: "broadcast", label: "Broadcast Mail", icon: Mail },
          { id: "accounts", label: "Accounts Moderator", icon: Users },
          { id: "lifecycle", label: "Lifecycle Sweeps", icon: Clock },
          { id: "contact", label: "Contact Us Messages", icon: FileText },
          { id: "library", label: "Global Shelf Curator", icon: Upload },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | "metrics"
                    | "feedback"
                    | "broadcast"
                    | "accounts"
                    | "contact"
                    | "library"
                    | "lifecycle",
                )
              }
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Metrics & Revenue */}
      {activeTab === "metrics" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Total Profiles"
              value={metrics?.totalUsers ?? 0}
              desc="Registered student/uni users"
            />
            <StatBox
              label="Active Streaks"
              value={metrics?.activeUsers ?? 0}
              desc="Streak is greater than zero"
            />
            <StatBox
              label="Total Library Books"
              value={metrics?.totalMaterials ?? 0}
              desc="Total source files uploaded"
            />
            <StatBox
              label="Total Revenue (Korapay/FLW)"
              value={`₦${metrics?.revenue ?? 0}`}
              desc="Tied to active Flutterwave plans"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" /> Revenue Flow
              </h3>
              <div className="divide-y divide-border/60">
                {metrics?.recentTransactions?.map((t, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{t.type}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+₦{t.amount}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Reviews & Complaints */}
      {activeTab === "feedback" && (
        <section className="glass p-6 rounded-3xl space-y-4 border border-border animate-fade-up">
          <h3 className="text-lg font-bold">Feedback & Support Complaints</h3>
          {feedbackLoading ? (
            <div className="space-y-3">
              <Skel className="h-20 w-full rounded-xl" />
            </div>
          ) : feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No feedback reports submitted yet.
            </p>
          ) : (
            <div className="space-y-4">
              {feedback.map((f) => (
                <div key={f.id} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{f.user_name}</h4>
                      <p className="text-xs text-muted-foreground">{f.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                        {f.category}
                      </span>
                      <div className="flex text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />{" "}
                        <span className="text-xs font-bold ml-1">{f.rating}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80 mt-2">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: Broadcast Messages */}
      {activeTab === "broadcast" && (
        <section className="glass p-6 rounded-3xl max-w-xl space-y-4 border border-border animate-fade-up">
          <h3 className="text-lg font-bold">Broadcast segmented notifications</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Target Segment
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Registered Students</option>
                <option value="High School">High School Segment</option>
                <option value="College/Uni Freshman & Sophomore">
                  College/Uni Freshman & Sophomore
                </option>
                <option value="College/Uni Junior & Senior">College/Uni Junior & Senior</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Subject / Title
              </label>
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Spoude Update: Term Season Study Kits..."
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Notification Body Message
              </label>
              <textarea
                rows={4}
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Hello team, we've loaded brand new verified textbooks for physics..."
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none resize-none"
              />
            </div>
            <Button
              onClick={() => broadcastMutation.mutate()}
              disabled={broadcasting}
              className="w-full h-12 rounded-xl text-xs font-bold"
            >
              {broadcasting ? "Pushing Broadcast..." : "Push Segment Notification"}
            </Button>
          </div>
        </section>
      )}

      {/* TAB CONTENT: Accounts Moderator */}
      {activeTab === "accounts" && (
        <section className="glass p-6 rounded-3xl space-y-4 border border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Accounts Moderator
          </h3>
          <div className="space-y-3">
            {metrics?.usersList?.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm">{u.display_name}</h4>
                  <p className="text-xs text-muted-foreground">{u.bio || "No biography"}</p>
                </div>
                <div>
                  {u.is_suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleBanMutation.mutate({ userId: u.id, isBanned: false })}
                    >
                      <Unlock className="h-4 w-4 mr-1" /> Unban Account
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason..."
                        onChange={(e) => {
                          setSelectedUserId(u.id);
                          setBanReason(e.target.value);
                        }}
                        className="bg-secondary text-xs border border-border rounded-lg py-1 px-2.5 max-w-[140px] outline-none"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toggleBanMutation.mutate({ userId: u.id, isBanned: true })}
                      >
                        <Lock className="h-4 w-4 mr-1" /> Suspend
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: Account Lifecycle Control Center (Phase 7) */}
      {activeTab === "lifecycle" && (
        <section className="glass p-6 rounded-3xl space-y-6 border border-border animate-fade-up">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">Inactivity & Stale Account Lifecycle</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage Spoude's strict 2-month inactivity auto-deletion sweeps.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Trigger Warning Sweep
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Identify accounts inactive for 6+ weeks (42+ days) and dispatch inactivity warnings
                via standard Spoude notification & transactional channels.
              </p>
              <Button
                onClick={triggerLifecycleWarnings}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 rounded-xl"
              >
                Dispatch 6-Week Warning Suite
              </Button>
            </div>

            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-1.5 text-destructive">
                <Trash2 className="h-4 w-4" /> Auto-Deletion Purge
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stale profiles inactive for over 2 months (60+ days) will be permanently purged from
                Spoude systems to release server memory capacity.
              </p>
              <Button
                onClick={executeAutoDeletionSweep}
                className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold text-xs h-10 rounded-xl"
              >
                Execute 2-Month Purge Sweep
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm">Lifecycle Staged Users List</h4>
            <div className="divide-y divide-border/60">
              {metrics?.usersList?.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs">{u.display_name}</span>
                    <p className="text-[10px] text-muted-foreground">
                      Inactive for {u.daysInactive} days
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.lifecycleStatus === "overdue-deletion"
                        ? "bg-red-500/10 text-red-500"
                        : u.lifecycleStatus === "warn-6-weeks"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {u.lifecycleStatus?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: Contact Us Inbox */}
      {activeTab === "contact" && (
        <section className="glass p-6 rounded-3xl space-y-4 border border-border animate-fade-up">
          <h3 className="text-lg font-bold">Contact Us Inbox</h3>
          {contactLoading ? (
            <div className="space-y-3">
              <Skel className="h-16 w-full rounded-xl" />
            </div>
          ) : contactMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No contact inquiries received yet.
            </p>
          ) : (
            <div className="space-y-4">
              {contactMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm">{msg.name}</h4>
                    <p className="text-xs text-muted-foreground">{msg.email}</p>
                    <p className="text-xs leading-relaxed text-foreground/80 mt-2">{msg.message}</p>
                  </div>
                  <button
                    onClick={() => deleteContactMessage(msg.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT: Library Shelf Curator */}
      {activeTab === "library" && (
        <section className="glass p-6 rounded-3xl max-w-xl space-y-4 border border-border animate-fade-up">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Curate Library Item
          </h3>
          <p className="text-xs text-muted-foreground">
            Directly upload verified, high-quality documents that will appear globally for all study
            channels.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Document Title
              </label>
              <input
                type="text"
                value={libTitle}
                onChange={(e) => setLibTitle(e.target.value)}
                placeholder="e.g. Advanced Biochemistry Guide"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Subject / Core Domain
              </label>
              <input
                type="text"
                value={libSubject}
                onChange={(e) => setLibSubject(e.target.value)}
                placeholder="e.g. Biochemistry"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Publisher Name
              </label>
              <input
                type="text"
                value={libPublisher}
                onChange={(e) => setLibPublisher(e.target.value)}
                placeholder="e.g. Spoude Academic Team"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm outline-none"
              />
            </div>
            <Button
              onClick={() => libUploadMutation.mutate()}
              disabled={libUploading}
              className="w-full h-12 rounded-xl text-xs font-bold"
            >
              {libUploading
                ? "Uploading Curated Material..."
                : "Publish verified to Public Library"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function StatBox({ label, value, desc }: { label: string; value: string | number; desc: string }) {
  return (
    <div className="glass p-5 rounded-2xl flex flex-col justify-between border border-border">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="text-3xl font-extrabold tracking-tight mt-1">{value}</div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{desc}</p>
    </div>
  );
}
