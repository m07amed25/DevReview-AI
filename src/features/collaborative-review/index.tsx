"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  PusherProvider,
  usePresenceChannel,
  useChannelEvent,
  useTypingIndicator,
  PUSHER_EVENTS,
} from "@/lib/pusher/client";
import { reviewChannel } from "@/server/pusher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  Circle,
} from "lucide-react";
import { PresenceAvatars } from "./components/presence-avatars";
import { NewThreadForm } from "./components/new-thread-form";
import { ThreadCard } from "./components/thread-card";

interface ThreadComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string; image?: string | null };
}

interface Thread {
  id: string;
  file: string;
  line: number;
  resolved: boolean;
  createdAt: string | Date;
  comments: ThreadComment[];
}

interface CollaborativeReviewProps {
  reviewId: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin?: boolean;
  prFiles?: string[];
}

export function CollaborativeReview(props: CollaborativeReviewProps) {
  return (
    <PusherProvider>
      <CollaborativeReviewInner {...props} />
    </PusherProvider>
  );
}

function CollaborativeReviewInner({
  reviewId,
  currentUserId,
  currentUserName,
  isAdmin,
  prFiles = [],
}: CollaborativeReviewProps) {
  const channelName = reviewChannel(reviewId);
  const { members, myId } = usePresenceChannel(channelName);
  const { typingNames, triggerTyping } = useTypingIndicator(channelName);
  const [showResolved, setShowResolved] = useState(false);
  const [newThread, setNewThread] = useState<{ file: string; line: number } | null>(null);

  const threadsQuery = trpc.collaboration.getThreads.useQuery(
    { reviewId },
    { refetchOnWindowFocus: false },
  );
  const threads: Thread[] = (threadsQuery.data ?? []) as Thread[];

  useChannelEvent<Thread>(channelName, PUSHER_EVENTS.THREAD_CREATED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_ADDED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_DELETED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_RESOLVED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_REOPENED, () => { threadsQuery.refetch(); });

  const activeThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  return (
    <div className="space-y-4">
      <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md ring-1 ring-primary/20">
                  <MessageCircle className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight">Discussion</h3>
              </div>
              <Badge variant="secondary" className="tabular-nums text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {activeThreads.length} open
              </Badge>
              {resolvedThreads.length > 0 && (
                <Badge
                  variant="outline"
                  className="tabular-nums text-xs cursor-pointer bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  onClick={() => setShowResolved((v) => !v)}
                >
                  <CheckCircle2 className="size-3.5 mr-1" />
                  {resolvedThreads.length} resolved
                </Badge>
              )}
            </div>
            <PresenceAvatars members={members} myId={myId} isAdmin={isAdmin} />
          </div>
          {typingNames.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <Circle key={i} className="size-1.5 fill-current" style={{ animation: "typingDot 1.4s ease-in-out infinite", animationDelay: `${i * 160}ms` }} />
                ))}
              </div>
              <span>
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing…`
                  : `${typingNames.slice(0, -1).join(", ")} and ${typingNames[typingNames.length - 1]} are typing…`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {!newThread && (
        <Button variant="outline" size="sm" className="gap-2 w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 group transition-all duration-300 h-10" onClick={() => setNewThread({ file: "", line: 0 })}>
          <MessageCircle className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          Start a Discussion Thread
        </Button>
      )}

      {newThread && (
        <NewThreadForm
          reviewId={reviewId}
          onCancel={() => setNewThread(null)}
          onCreated={() => { setNewThread(null); threadsQuery.refetch(); }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          triggerTyping={triggerTyping}
          prFiles={prFiles}
        />
      )}

      {threadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading discussions…
        </div>
      ) : activeThreads.length === 0 && resolvedThreads.length === 0 ? (
        <Card className="border-dashed bg-muted/30 border-primary/20">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center">
            <div className="relative mb-5 group cursor-default">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <MessageCircle className="size-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <p className="text-base font-semibold text-foreground tracking-tight">No discussions yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mt-2 leading-relaxed">
              Start a thread to collaborate, ask questions, or suggest improvements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} currentUserId={currentUserId} currentUserName={currentUserName} triggerTyping={triggerTyping} />
          ))}
        </div>
      )}

      {showResolved && resolvedThreads.length > 0 && (
        <div className="space-y-3 opacity-60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <CheckCircle2 className="size-3" />
            <span className="font-medium">Resolved</span>
          </div>
          {resolvedThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} currentUserId={currentUserId} currentUserName={currentUserName} triggerTyping={triggerTyping} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
