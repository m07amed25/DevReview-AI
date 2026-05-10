"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo-noback.png"
      alt="Code Catch Logo"
      width={57}
      height={40}
      className={cn("h-8 w-auto object-contain", className)}
      priority
    />
  );
}
