"use client";

import dynamic from "next/dynamic";

const Header = dynamic(
  () => import("@/components/header").then((m) => m.Header),
  {
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-50 w-full h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl" />
    ),
  },
);

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string;
}

export function ClientHeader({ user }: { user: User }) {
  return <Header user={user} />;
}
