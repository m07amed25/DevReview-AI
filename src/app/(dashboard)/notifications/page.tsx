"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  UserCog,
  FileCheck,
  FileX,
  Search,
  Calendar,
  Clock,
  Archive,
  Settings,
  AlertCircle,
  GitPullRequest,
  ThumbsUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Extracts the token query param from an invite link */
function extractInviteToken(link: string): string | null {
  try {
    const url = new URL(link, "http://localhost");
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

/** Team Invite Inline Actions */
function TeamInviteActions({
  link,
  onDone,
}: {
  link: string;
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
        className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
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
        className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {decline.isPending && <Loader2 className="size-3 animate-spin" />}
        Decline
      </button>
    </div>
  );
}

type FilterType = "all" | "unread" | "read";
type NotificationType =
  | "all"
  | "TEAM_INVITE"
  | "TEAM_MEMBER_ADDED"
  | "REVIEW_COMPLETED"
  | "REVIEW_FAILED"
  | "SCHEDULED_SCAN_COMPLETED"
  | "REVIEW_ASSIGNED"
  | "REVIEW_APPROVED"
  | "REVIEW_CHANGES_REQUESTED";

const notificationTypeLabels: Record<string, string> = {
  all: "All Types",
  TEAM_INVITE: "Team Invites",
  TEAM_MEMBER_ADDED: "Team Members",
  REVIEW_COMPLETED: "Reviews Completed",
  REVIEW_FAILED: "Reviews Failed",
  SCHEDULED_SCAN_COMPLETED: "Scheduled Scans",
  REVIEW_ASSIGNED: "Review Assignments",
  REVIEW_APPROVED: "Reviews Approved",
  REVIEW_CHANGES_REQUESTED: "Changes Requested",
};

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: notificationsData, isLoading } =
    trpc.notification.list.useQuery({
      limit: 50,
      unreadOnly: filterType === "unread",
    });

  const { data: unreadData } = trpc.notification.unreadCount.useQuery();

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
      toast.success("Notification deleted");
    },
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  // Filter and search notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by read status
    if (filterType === "unread" && notification.read) return false;
    if (filterType === "read" && !notification.read) return false;

    // Filter by notification type
    if (notificationType !== "all" && notification.type !== notificationType)
      return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

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
      case "SCHEDULED_SCAN_COMPLETED":
        return <Clock className="size-5 text-purple-500" />;
      case "REVIEW_ASSIGNED":
        return <GitPullRequest className="size-5 text-orange-500" />;
      case "REVIEW_APPROVED":
        return <ThumbsUp className="size-5 text-green-600" />;
      case "REVIEW_CHANGES_REQUESTED":
        return <AlertTriangle className="size-5 text-yellow-500" />;
      default:
        return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedIds).map((id) =>
      deleteNotification.mutateAsync({ id })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notifications deleted`);
  };

  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedIds).map((id) =>
      markAsRead.mutateAsync({ id })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notifications marked as read`);
  };

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-2.5">
              Stay updated with your code reviews and team activities
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings#notifications")}
          >
            <Settings className="mr-2 size-4" />
            Preferences
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <p className="text-2xl font-bold mt-3">{notifications.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Unread
              </span>
            </div>
            <p className="text-2xl font-bold mt-3">{unreadCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2">
              <Archive className="size-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Read
              </span>
            </div>
            <p className="text-2xl font-bold mt-3">
              {notifications.length - unreadCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="w-full md:w-45"
        >
          <option value="all">All Notifications</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </Select>
        <Select
          value={notificationType}
          onChange={(e) => setNotificationType(e.target.value as NotificationType)}
          className="w-full md:w-50"
        >
          {Object.entries(notificationTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border bg-muted/50 p-5">
          <span className="text-sm font-medium">
            {selectedIds.size} notification{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMarkAsRead}
              disabled={markAsRead.isPending}
            >
              <Check className="mr-2 size-4" />
              Mark as Read
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={deleteNotification.isPending}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filteredNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-muted-foreground"
            >
              {selectedIds.size === filteredNotifications.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 size-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || notificationType !== "all"
                ? "No notifications match your filters"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => {
              const isInvite = notification.type === "TEAM_INVITE";
              const hasLink = !!notification.link;
              const isSelected = selectedIds.has(notification.id);

              const inner = (
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(notification.id);
                    }}
                    className="mt-1.5 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select notification"
                  />

                  {/* Icon */}
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.read && "text-foreground font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          {notification.message}
                        </p>

                        {isInvite && notification.link && (
                          <TeamInviteActions
                            link={notification.link}
                            onDone={() => {
                              markAsRead.mutate({ id: notification.id });
                            }}
                          />
                        )}

                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Actions</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead.mutate({ id: notification.id });
                              }}
                            >
                              <Check className="mr-2 size-4" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification.mutate({
                                id: notification.id,
                              });
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );

              const itemClass = cn(
                "p-5 transition-colors hover:bg-muted/50",
                !notification.read && "bg-blue-500/5",
                !isInvite && hasLink && "cursor-pointer"
              );

              // Non-invite with a link: make entire row clickable
              if (!isInvite && hasLink && notification.link) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    className={itemClass}
                    onClick={() => {
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
    </div>
  );
}
