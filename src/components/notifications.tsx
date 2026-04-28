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
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
        className="mt-2 inline-block text-xs font-medium text-blue-500 hover:underline"
        onClick={onDone}
      >
        View invite &rarr;
      </Link>
    );
  }

  const isPending = accept.isPending || decline.isPending;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          accept.mutate({ token });
        }}
        className="flex items-center gap-1 rounded-md bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {accept.isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <UserPlus className="size-3" />
        )}
        Accept
      </button>
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          decline.mutate({ token });
        }}
        className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {decline.isPending && <Loader2 className="size-3 animate-spin" />}
        Decline
      </button>
    </div>
  );
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

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
        return <UserPlus className="size-5 text-blue-500" />;
      case "TEAM_MEMBER_ADDED":
        return <UserCog className="size-5 text-green-500" />;
      case "REVIEW_COMPLETED":
        return <FileCheck className="size-5 text-emerald-500" />;
      case "REVIEW_FAILED":
        return <FileX className="size-5 text-red-500" />;
      default:
        return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-md hover:bg-muted transition-colors",
          isOpen && "bg-muted",
        )}
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => {
                  const isInvite = notification.type === "TEAM_INVITE";
                  const hasLink = !!notification.link;

                  const inner = (
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.read && "text-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
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

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead.mutate({ id: notification.id });
                                }}
                                className="p-1 hover:bg-muted rounded"
                                title="Mark as read"
                              >
                                <Check className="size-3 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification.mutate({
                                  id: notification.id,
                                });
                              }}
                              className="p-1 hover:bg-muted rounded"
                              title="Delete"
                            >
                              <Trash2 className="size-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  const itemClass = cn(
                    "group border-b px-4 py-3 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/30",
                    !isInvite && hasLink && "cursor-pointer",
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
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t p-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-md px-3 py-1.5 text-center text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
