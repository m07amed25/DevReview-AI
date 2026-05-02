"use client";

import { useSession } from "@/lib/auth-client";
import {
  CursorProvider,
  Cursor,
  CursorFollow,
} from "@/components/animate-ui/components/animate/cursor";

export function GlobalCursorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <CursorProvider global={true}>
      <Cursor />
      <CursorFollow>{session?.user?.name || "DevReview AI"}</CursorFollow>
      {children}
    </CursorProvider>
  );
}
