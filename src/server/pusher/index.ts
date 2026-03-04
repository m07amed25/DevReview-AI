import Pusher from "pusher";

let pusherServer: Pusher | null = null;

/**
 * Returns a singleton Pusher server instance.
 * If PUSHER env vars are missing, returns null (real-time features disabled).
 */
export function getPusherServer(): Pusher | null {
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.PUSHER_CLUSTER
  ) {
    return null;
  }

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

// ─── Channel helpers ───────────────────────────────────────────────
export function reviewChannel(reviewId: string) {
  return `presence-review-${reviewId}`;
}

// ─── Event names ───────────────────────────────────────────────────
export const PUSHER_EVENTS = {
  // Thread events
  THREAD_CREATED: "thread:created",
  THREAD_RESOLVED: "thread:resolved",
  THREAD_REOPENED: "thread:reopened",

  // Comment events
  COMMENT_ADDED: "comment:added",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",

  // Presence / cursor events (client events)
  CLIENT_TYPING: "client-typing",
  CLIENT_CURSOR: "client-cursor",
} as const;
