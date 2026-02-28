"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Animation timing constants - consistent across the site
export const ANIMATION = {
  // Durations
  duration: {
    fast: 0.3,
    normal: 0.5,
    slow: 0.8,
    verySlow: 1.2,
  },
  // Delays
  delay: {
    small: 0.1,
    medium: 0.2,
    large: 0.4,
  },
  // Easing functions
  ease: {
    smooth: "power2.out",
    smoothIn: "power2.in",
    smoothInOut: "power2.inOut",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    sharp: "power3.out",
    sharpIn: "power3.in",
  },
  // Stagger amounts
  stagger: {
    small: 0.05,
    medium: 0.1,
    large: 0.2,
  },
  // Scroll trigger settings
  scrollTrigger: {
    start: "top 85%",
    end: "bottom 15%",
    toggleActions: "play none none reverse",
  },
} as const;

// Animation variants for different entrance types
export type AnimationVariant =
  | "fadeIn"
  | "fadeInUp"
  | "fadeInDown"
  | "fadeInLeft"
  | "fadeInRight"
  | "scaleIn"
  | "scaleInUp"
  | "slideInUp"
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight"
  | "blurIn"
  | "bounceIn";

interface AnimateInProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

function getAnimationProperties(variant: AnimationVariant) {
  const properties: Record<
    AnimationVariant,
    { from: gsap.TweenVars; to: gsap.TweenVars }
  > = {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeInUp: {
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0 },
    },
    fadeInDown: {
      from: { opacity: 0, y: -30 },
      to: { opacity: 1, y: 0 },
    },
    fadeInLeft: {
      from: { opacity: 0, x: -30 },
      to: { opacity: 1, x: 0 },
    },
    fadeInRight: {
      from: { opacity: 0, x: 30 },
      to: { opacity: 1, x: 0 },
    },
    scaleIn: {
      from: { opacity: 0, scale: 0.8 },
      to: { opacity: 1, scale: 1 },
    },
    scaleInUp: {
      from: { opacity: 0, scale: 0.8, y: 30 },
      to: { opacity: 1, scale: 1, y: 0 },
    },
    slideInUp: {
      from: { y: 100, opacity: 0 },
      to: { y: 0, opacity: 1 },
    },
    slideInDown: {
      from: { y: -100, opacity: 0 },
      to: { y: 0, opacity: 1 },
    },
    slideInLeft: {
      from: { x: -100, opacity: 0 },
      to: { x: 0, opacity: 1 },
    },
    slideInRight: {
      from: { x: 100, opacity: 0 },
      to: { x: 0, opacity: 1 },
    },
    blurIn: {
      from: { opacity: 0, filter: "blur(10px)" },
      to: { opacity: 1, filter: "blur(0px)" },
    },
    bounceIn: {
      from: { opacity: 0, scale: 0.3 },
      to: { opacity: 1, scale: 1 },
    },
  };
  return properties[variant];
}

// AnimateIn - Component entrance animation
export function AnimateIn({
  children,
  variant = "fadeInUp",
  delay = 0,
  duration = ANIMATION.duration.slow,
  className = "",
  once = true,
}: AnimateInProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const { from, to } = getAnimationProperties(variant);

    gsap.fromTo(
      element,
      { ...from, duration: 0 },
      {
        ...to,
        duration,
        delay,
        ease: ANIMATION.ease.sharp,
        scrollTrigger: once
          ? {
              trigger: element,
              start: ANIMATION.scrollTrigger.start,
              toggleActions: ANIMATION.scrollTrigger.toggleActions,
            }
          : undefined,
      },
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [variant, delay, duration, once]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Staggered animation wrapper
interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  variant?: AnimationVariant;
}

export function StaggeredList({
  children,
  className = "",
  stagger = ANIMATION.stagger.medium,
  variant = "fadeInUp",
}: StaggeredListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.children;
    const { from, to } = getAnimationProperties(variant);

    gsap.fromTo(
      children,
      { ...from, duration: 0 },
      {
        ...to,
        duration: ANIMATION.duration.normal,
        stagger,
        ease: ANIMATION.ease.sharp,
        scrollTrigger: {
          trigger: container,
          start: ANIMATION.scrollTrigger.start,
          toggleActions: ANIMATION.scrollTrigger.toggleActions,
        },
      },
    );
  }, [variant, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Parallax effect component
interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({
  children,
  speed = 0.5,
  className = "",
}: ParallaxProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    gsap.to(element, {
      y: () => -window.innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }, [speed]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Magnetic hover effect
interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({
  children,
  strength = 0.3,
  className = "",
}: MagneticProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(element, {
        x: x * strength,
        y: y * strength,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: ANIMATION.duration.normal,
        ease: ANIMATION.ease.bounce,
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Smooth reveal on scroll
interface RevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = "up",
  distance = 50,
  className = "",
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const directions = {
      up: { y: -distance },
      down: { y: distance },
      left: { x: -distance },
      right: { x: distance },
    };

    gsap.fromTo(
      element,
      {
        ...directions[direction],
        opacity: 0,
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: ANIMATION.duration.slow,
        ease: ANIMATION.ease.sharp,
        scrollTrigger: {
          trigger: element,
          start: ANIMATION.scrollTrigger.start,
          toggleActions: ANIMATION.scrollTrigger.toggleActions,
        },
      },
    );
  }, [direction, distance]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Text reveal animation
interface TextRevealProps<T extends keyof React.JSX.IntrinsicElements = "div"> {
  text: string;
  className?: string;
  as?: T;
}

export function TextReveal<
  T extends keyof React.JSX.IntrinsicElements = "div",
>({ text, className = "", as: Component = "div" as T }: TextRevealProps<T>) {
  const elementRef = useRef<React.ElementRef<T>>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Split text into words
    const words = text.split(" ");
    (element as unknown as HTMLElement).innerHTML = words
      .map(
        (word) =>
          `<span style="display: inline-block; opacity: 0; transform: translateY(20px)">${word}&nbsp;</span>`,
      )
      .join("");

    gsap.to(element.children, {
      opacity: 1,
      y: 0,
      duration: ANIMATION.duration.normal,
      stagger: ANIMATION.stagger.small,
      ease: ANIMATION.ease.sharp,
      scrollTrigger: {
        trigger: element,
        start: ANIMATION.scrollTrigger.start,
        toggleActions: ANIMATION.scrollTrigger.toggleActions,
      },
    });
  }, [text]);

  return (
    <Component ref={elementRef} className={className}>
      {text}
    </Component>
  );
}

// Hover scale effect
interface HoverScaleProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({
  children,
  scale = 1.05,
  className = "",
}: HoverScaleProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [scale]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Animated counter
interface CounterProps {
  end: number;
  duration?: number;
  className?: string;
}

export function Counter({ end, duration = 2, className = "" }: CounterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const obj = { value: 0 };

    gsap.to(obj, {
      value: end,
      duration,
      ease: ANIMATION.ease.smooth,
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString();
      },
      scrollTrigger: {
        trigger: element,
        start: ANIMATION.scrollTrigger.start,
        toggleActions: ANIMATION.scrollTrigger.toggleActions,
      },
    });
  }, [end, duration]);

  return <span ref={elementRef} className={className} />;
}

// Ripple effect component
interface RippleProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function Ripple({
  children,
  className = "",
  color = "rgba(255, 255, 255, 0.3)",
}: RippleProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        width: 20px;
        height: 20px;
        left: ${x - 10}px;
        top: ${y - 10}px;
        transform: scale(0);
        opacity: 1;
      `;

      element.appendChild(ripple);

      gsap.to(ripple, {
        scale: 20,
        opacity: 0,
        duration: ANIMATION.duration.slow,
        ease: ANIMATION.ease.smoothInOut,
        onComplete: () => {
          ripple.remove();
        },
      });
    };

    element.addEventListener("click", handleClick);
    return () => {
      element.removeEventListener("click", handleClick);
    };
  }, [color]);

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// Shimmer effect
interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export function Shimmer({ children, className = "" }: ShimmerProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const shimmer = document.createElement("div");
    shimmer.className = "shimmer-effect";
    shimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transform: skewX(-20deg);
    `;

    element.appendChild(shimmer);

    gsap.to(shimmer, {
      left: "100%",
      duration: ANIMATION.duration.slow * 2,
      repeat: -1,
      ease: "none",
    });
  }, []);

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// Glow effect on hover
interface GlowEffectProps {
  children: ReactNode;
  glowColor?: string;
  className?: string;
}

export function GlowEffect({
  children,
  glowColor = "rgba(99, 102, 241, 0.5)",
  className = "",
}: GlowEffectProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, {
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        boxShadow: "none",
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [glowColor]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Entrance animation
    gsap.fromTo(
      element,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: ANIMATION.duration.normal,
        ease: ANIMATION.ease.sharp,
      },
    );
  }, []);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Export ScrollTrigger for external use
export { ScrollTrigger, gsap };
