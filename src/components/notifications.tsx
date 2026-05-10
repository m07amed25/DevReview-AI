"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        onClick={onDone}
      >
        <span>View invite</span>
        <ExternalLink className="size-3" />
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
        className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {accept.isPending && <Loader2 className="size-3 animate-spin" />}
        <span>Accept</span>
      </button>
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          decline.mutate({ token });
        }}
        className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
      >
        {decline.isPending && <Loader2 className="size-3 animate-spin" />}
        <span>Decline</span>
      </button>
    </div>
  );
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "size-4";
    switch (type) {
      case "TEAM_INVITE":
        return <UserPlus className={cn(iconClass, "text-blue-500")} />;
      case "TEAM_MEMBER_ADDED":
        return <UserCog className={cn(iconClass, "text-indigo-500")} />;
      case "REVIEW_COMPLETED":
        return <FileCheck className={cn(iconClass, "text-emerald-500")} />;
      case "REVIEW_FAILED":
        return <FileX className={cn(iconClass, "text-red-500")} />;
      case "SCHEDULED_SCAN_COMPLETED":
        return <Clock className={cn(iconClass, "text-purple-500")} />;
      case "REVIEW_ASSIGNED":
        return <GitPullRequest className={cn(iconClass, "text-amber-500")} />;
      case "REVIEW_APPROVED":
        return <ThumbsUp className={cn(iconClass, "text-green-500")} />;
      case "REVIEW_CHANGES_REQUESTED":
        return <AlertTriangle className={cn(iconClass, "text-orange-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center size-9 rounded-md transition-colors",
          isOpen
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-background" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-lg border bg-popover text-popover-foreground shadow-md outline-hidden overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-4" />
                  </button>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  title="View all notifications"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[350px] overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="size-5 text-muted-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-3">
                    <Check className="size-5 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    You&apos;re all caught up
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    No new notifications.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification, idx) => {
                    const isInvite = notification.type === "TEAM_INVITE";
                    const hasLink = !!notification.link;
                    const isRead = notification.read;

                    const inner = (
                      <div className="flex items-start gap-3 w-full">
                        <div className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm",
                                isRead
                                  ? "font-medium text-foreground/80"
                                  : "font-semibold text-foreground",
                              )}
                            >
                              {notification.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {notification.message}
                          </p>

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
                        </div>
                      </div>
                    );

                    const itemClass = cn(
                      "group relative flex items-start p-4 transition-colors",
                      !isRead
                        ? "bg-blue-50/30 dark:bg-blue-500/5"
                        : "hover:bg-accent/50",
                      idx !== notifications.length - 1 &&
                        "border-b border-border/50",
                      !isInvite && hasLink && "cursor-pointer",
                    );

                    return (
                      <div key={notification.id} className="relative group/row">
                        {/* Hover Actions */}
                        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-background/80 backdrop-blur-xs rounded-md shadow-xs border p-0.5">
                          {!isRead && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead.mutate({ id: notification.id });
                              }}
                              className="p-1 rounded-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Mark as read"
                            >
                              <Check className="size-3.5" />
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
                            className="p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {!isInvite && hasLink && notification.link ? (
                          <Link
                            href={notification.link}
                            className={itemClass}
                            onClick={() => {
                              setIsOpen(false);
                              if (!isRead)
                                markAsRead.mutate({ id: notification.id });
                            }}
                          >
                            {!isRead && (
                              <span className="absolute left-1.5 top-5 size-1.5 rounded-full bg-blue-500" />
                            )}
                            {inner}
                          </Link>
                        ) : (
                          <div className={itemClass}>
                            {!isRead && (
                              <span className="absolute left-1.5 top-5 size-1.5 rounded-full bg-blue-500" />
                            )}
                            {inner}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t bg-muted/20 p-2">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  View all activity
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
