"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";

interface PageTransitionProviderProps {
  children: ReactNode;
}

export function PageTransitionProvider({
  children,
}: PageTransitionProviderProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Smooth subtle entrance animation
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      // Skip exit animation for smoother transition, just subtle entrance
      gsap.fromTo(
        content,
        { opacity: 0.8 },
        {
          opacity: 1,
          duration: 0.2,
          ease: "power1.out",
        },
      );
    } else {
      // Initial load animation - subtle
      gsap.fromTo(
        content,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: "power1.out",
        },
      );
    }

    prevPathRef.current = pathname;

    // Smooth scroll to top on route change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return <div ref={contentRef}>{children}</div>;
}

// Fade page transition
interface FadePageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function FadePageTransition({
  children,
  className = "",
}: FadePageTransitionProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Reset and animate
    gsap.set(content, { opacity: 0 });
    gsap.to(content, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );
}

// Slide page transition
interface SlidePageTransitionProps {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
}

export function SlidePageTransition({
  children,
  className = "",
  direction = "left",
}: SlidePageTransitionProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  const getFromValues = () => {
    switch (direction) {
      case "left":
        return { x: -50, opacity: 0 };
      case "right":
        return { x: 50, opacity: 0 };
      case "up":
        return { y: -50, opacity: 0 };
      case "down":
        return { y: 50, opacity: 0 };
    }
  };

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const fromValues = getFromValues();

    gsap.fromTo(content, fromValues, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, direction]);

  return (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );
}

// Scale page transition
interface ScalePageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ScalePageTransition({
  children,
  className = "",
}: ScalePageTransitionProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    gsap.fromTo(
      content,
      { scale: 0.95, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.2)",
      },
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );
}
