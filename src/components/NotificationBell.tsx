import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Sparkles, Info, Trophy, Clock3 } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  kind: "info" | "success" | "reminder" | "achievement" | string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const KIND_ICON: Record<string, typeof Info> = {
  info: Info,
  success: Sparkles,
  reminder: Clock3,
  achievement: Trophy,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Notification[];
    },
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Live updates — new notifications appear without a refresh.
  useEffect(() => {
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
      (prev ?? []).map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  };

  const openNotification = async (n: Notification) => {
    if (!n.read_at) {
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
        (prev ?? []).map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      );
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link as never });
  };

  const buttonClass =
    variant === "mobile"
      ? "p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
      : "p-1.5 rounded-full hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="relative" ref={popRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={`relative ${buttonClass}`}
      >
        <Bell className={variant === "mobile" ? "h-5 w-5" : "h-4 w-4"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-elev-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl border border-border shadow-elev-3 z-50 animate-fade-up overflow-hidden"
          style={{ background: "var(--popover)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
                Nothing here yet.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = KIND_ICON[n.kind] ?? Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-sidebar-accent transition-colors ${
                      !n.read_at ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <div
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                        !n.read_at ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium truncate">{n.title}</span>
                        {!n.read_at && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <span className="text-[10px] text-muted-foreground/70 mt-1 block">{timeAgo(n.created_at)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
