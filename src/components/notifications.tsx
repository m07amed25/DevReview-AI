"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  UserCog,
  FileCheck,
  FileX,
  Loader2,
  Clock,
  GitPullRequest,
  ThumbsUp,
  AlertTriangle,
  ExternalLink,
  CheckCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { authClient } from "@/lib/auth-client";

/** Extracts the token query param from an invite link like /teams/accept-invite?token=<uuid> */
function extractInviteToken(link: string): string | null {
  try {
    const url = new URL(link, "http://localhost");
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

/** Inline Accept / Decline buttons rendered inside a TEAM_INVITE notification. */
function TeamInviteActions({
  link,
  onDone,
}: {
  link: string;
  notificationId: string;
  onDone: () => void;
}) {
  const token = extractInviteToken(link);
  const utils = trpc.useUtils();
  const router = useRouter();

  const invalidate = () => {
    utils.notification.unreadCount.invalidate();
    utils.notification.list.invalidate();
  };

  const accept = trpc.team.acceptTeamInvite.useMutation({
    onSuccess: () => {
      toast.success("You've joined the team!");
      invalidate();
      onDone();
      router.push("/teams");
    },
    onError: (err) => toast.error(err.message || "Failed to accept invite"),
  });

  const decline = trpc.team.declineTeamInvite.useMutation({
    onSuccess: () => {
      toast.info("Invite declined");
      invalidate();
      onDone();
    },
    onError: (err) => toast.error(err.message || "Failed to decline invite"),
  });

  if (!token) {
    return (
      <Link
        href={link}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
        onClick={onDone}
      >
        <span>View invite</span>
        <ExternalLink className="size-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  const isPending = accept.isPending || decline.isPending;

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          accept.mutate({ token });
        }}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-green-500 to-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
      >
        {accept.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <UserPlus className="size-3.5" />
        )}
        <span>Accept Invite</span>
      </button>
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          decline.mutate({ token });
        }}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all duration-200"
      >
        {decline.isPending && <Loader2 className="size-3.5 animate-spin" />}
        <span>Decline</span>
      </button>
    </div>
  );
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  // Get current user for real-time notifications
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Enable real-time notifications
  useRealtimeNotifications(userId);

  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  const { data: notificationsData, isLoading } =
    trpc.notification.list.useQuery({ limit: 10 }, { enabled: isOpen });

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TEAM_INVITE":
        return <UserPlus className="size-4.5 text-blue-600 dark:text-blue-400" />;
      case "TEAM_MEMBER_ADDED":
        return <UserCog className="size-4.5 text-green-600 dark:text-green-400" />;
      case "REVIEW_COMPLETED":
        return <FileCheck className="size-4.5 text-emerald-600 dark:text-emerald-400" />;
      case "REVIEW_FAILED":
        return <FileX className="size-4.5 text-red-600 dark:text-red-400" />;
      case "SCHEDULED_SCAN_COMPLETED":
        return <Clock className="size-4.5 text-purple-600 dark:text-purple-400" />;
      case "REVIEW_ASSIGNED":
        return <GitPullRequest className="size-4.5 text-orange-600 dark:text-orange-400" />;
      case "REVIEW_APPROVED":
        return <ThumbsUp className="size-4.5 text-green-600 dark:text-green-400" />;
      case "REVIEW_CHANGES_REQUESTED":
        return <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="size-4.5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "TEAM_INVITE":
        return "Team";
      case "TEAM_MEMBER_ADDED":
        return "Team";
      case "REVIEW_COMPLETED":
        return "Review";
      case "REVIEW_FAILED":
        return "Review";
      case "SCHEDULED_SCAN_COMPLETED":
        return "Scan";
      case "REVIEW_ASSIGNED":
        return "Assignment";
      case "REVIEW_APPROVED":
        return "Approval";
      case "REVIEW_CHANGES_REQUESTED":
        return "Changes";
      default:
        return "Info";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-lg hover:bg-muted/60 transition-all duration-200 group",
          isOpen && "bg-muted/80 ring-2 ring-ring/20"
        )}
        aria-label="Notifications"
      >
        <Bell className={cn(
          "size-5 transition-colors duration-200",
          isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-linear-to-br from-red-500 to-red-600 text-[10px] font-bold text-white shadow-lg shadow-red-500/30 animate-in zoom-in-50 ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-3 w-105 rounded-xl border border-border/50 bg-linear-to-b from-background to-background/95 shadow-2xl shadow-black/10 backdrop-blur-xl animate-in slide-in-from-top-4 fade-in-0 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className="p-2 rounded-lg text-xs text-muted-foreground hover:bg-background hover:text-foreground transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-4" />
                  </button>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-xs text-muted-foreground hover:bg-background hover:text-foreground transition-all duration-200 hover:shadow-sm"
                  title="View all notifications"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-128 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {isLoading ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 mb-4">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted/50 mb-5 ring-8 ring-muted/20">
                    <Bell className="size-7 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-base font-semibold mb-2">All caught up!</h4>
                  <p className="text-sm text-muted-foreground max-w-70 mx-auto leading-relaxed">
                    You don&apos;t have any notifications right now. We&apos;ll let you know when something new arrives.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {notifications.map((notification) => {
                    const isInvite = notification.type === "TEAM_INVITE";
                    const hasLink = !!notification.link;

                    const inner = (
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-0.5">
                          <div className={cn(
                            "flex size-10 items-center justify-center rounded-lg transition-all duration-200",
                            !notification.read ? "bg-primary/10 ring-2 ring-primary/20" : "bg-muted/50"
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <p className={cn(
                                "text-sm leading-snug",
                                !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 font-medium shrink-0 bg-muted/60 hover:bg-muted border-0"
                            >
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                          </div>

                          {isInvite && notification.link && (
                            <TeamInviteActions
                              link={notification.link}
                              notificationId={notification.id}
                              onDone={() => {
                                markAsRead.mutate({ id: notification.id });
                                setIsOpen(false);
                              }}
                            />
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                              <Clock className="size-3" />
                              <span className="font-medium">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    markAsRead.mutate({ id: notification.id });
                                  }}
                                  className="p-1.5 hover:bg-muted/80 rounded-md transition-all duration-200 hover:shadow-sm"
                                  title="Mark as read"
                                >
                                  <Check className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteNotification.mutate({
                                    id: notification.id,
                                  });
                                }}
                                className="p-1.5 hover:bg-destructive/10 rounded-md transition-all duration-200 hover:shadow-sm"
                                title="Delete"
                              >
                                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    const itemClass = cn(
                      "group px-6 py-4 transition-all duration-200",
                      !notification.read && "bg-primary/5 border-l-4 border-l-primary shadow-sm",
                      !isInvite && hasLink && "cursor-pointer hover:bg-muted/40 active:bg-muted/60"
                    );

                    // Non-invite with a link: make entire row clickable
                    if (!isInvite && hasLink && notification.link) {
                      return (
                        <Link
                          key={notification.id}
                          href={notification.link}
                          className={itemClass}
                          onClick={() => {
                            setIsOpen(false);
                            if (!notification.read)
                              markAsRead.mutate({ id: notification.id });
                          }}
                        >
                          {inner}
                        </Link>
                      );
                    }

                    return (
                      <div key={notification.id} className={itemClass}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border/50 bg-muted/20 p-4 rounded-b-xl">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/80 hover:text-foreground bg-background/50 hover:bg-background hover:shadow-md transition-all duration-200 border border-border/40"
                >
                  <span>View all notifications</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
