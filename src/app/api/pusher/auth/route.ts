import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/server/pusher";
import { auth } from "@/server/auth";

/**
 * POST /api/pusher/auth
 * Authenticates the current user for Pusher presence channels.
 */
export async function POST(req: NextRequest) {
  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json(
      { error: "Real-time features are not configured" },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get("socket_id") as string;
  const channel = body.get("channel_name") as string;

  if (!socketId || !channel) {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 },
    );
  }

  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      image: session.user.image,
    },
  };

  const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
  return NextResponse.json(authResponse);
}
