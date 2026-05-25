"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { authClient } from "@/lib/auth-client";

function extractInviteToken(link: string): string | null {
  try { return new URL(link, "http://localhost").searchParams.get("token"); }
  catch { return null; }
}

function TeamInviteActions({ link, onDone }: { link: string; notificationId: string; onDone: () => void }) {
  const token = extractInviteToken(link);
  const utils = trpc.useUtils();
  const router = useRouter();
  const invalidate = () => { utils.notification.unreadCount.invalidate(); utils.notification.list.invalidate(); };

  const accept = trpc.team.acceptTeamInvite.useMutation({
    onSuccess: () => { toast.success("Joined!"); invalidate(); onDone(); router.push("/teams"); },
    onError: (e) => toast.error(e.message || "Failed"),
  });
  const decline = trpc.team.declineTeamInvite.useMutation({
    onSuccess: () => { toast.info("Declined"); invalidate(); onDone(); },
    onError: (e) => toast.error(e.message || "Failed"),
  });

  if (!token) return <Link href={link} onClick={onDone} className="mt-1.5 text-xs text-primary hover:underline">View invite</Link>;

  const pending = accept.isPending || decline.isPending;
  return (
    <div className="mt-2 flex gap-2">
      <button disabled={pending} onClick={(e) => { e.stopPropagation(); accept.mutate({ token }); }} className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-50">
        {accept.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
      </button>
      <button disabled={pending} onClick={(e) => { e.stopPropagation(); decline.mutate({ token }); }} className="px-2.5 py-1 text-xs font-medium border border-border rounded-sm hover:bg-muted disabled:opacity-50">
        {decline.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Decline"}
      </button>
    </div>
  );
}

function formatTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}d`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Notifications({ side = "bottom" }: { side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { data: session } = authClient.useSession();
  useRealtimeNotifications(session?.user?.id);

  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  const { data: notificationsData, isLoading } = trpc.notification.list.useQuery({ limit: 10 }, { enabled: open });

  const markAsRead = trpc.notification.markAsRead.useMutation({ onSuccess: () => { utils.notification.unreadCount.invalidate(); utils.notification.list.invalidate(); } });
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({ onSuccess: () => { utils.notification.unreadCount.invalidate(); utils.notification.list.invalidate(); } });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-8 w-8 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 w-80 rounded-sm border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden",
          side === "top" ? "bottom-full left-0 mb-1.5" : "top-full right-0 mt-1.5"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-medium">
              Notifications{unreadCount > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{unreadCount}</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead.mutate()} className="text-xs text-muted-foreground hover:text-foreground">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No notifications.</div>
            ) : (
              notifications.map((n, i) => {
                const isInvite = n.type === "TEAM_INVITE";
                const content = (
                  <div className={cn("px-3 py-2.5 flex gap-2.5 items-start", i !== notifications.length - 1 && "border-b border-border/50", !n.read && "bg-muted/20")}>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", n.read ? "text-muted-foreground" : "text-foreground")}>
                        <span className="font-medium">{n.title}</span>
                        {n.message && <span className="font-normal"> {n.message}</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">{formatTime(n.createdAt)}</p>
                      {isInvite && n.link && (
                        <TeamInviteActions link={n.link} notificationId={n.id} onDone={() => { markAsRead.mutate({ id: n.id }); setOpen(false); }} />
                      )}
                    </div>
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                );

                if (!isInvite && n.link) {
                  return (
                    <Link key={n.id} href={n.link} onClick={() => { setOpen(false); if (!n.read) markAsRead.mutate({ id: n.id }); }}>
                      {content}
                    </Link>
                  );
                }
                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-3 py-2 text-center text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
