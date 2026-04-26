"use client";

import { ReactLenis } from "lenis/react";

const lenisOptions = {
  autoRaf: true,
};

export function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
