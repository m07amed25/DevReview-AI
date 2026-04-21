"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const ANIMATION = {
  duration: { fast: 0.3, normal: 0.5, slow: 0.8, verySlow: 1.2 },
  delay: { small: 0.1, medium: 0.2, large: 0.4 },
  ease: {
    smooth: "power2.out",
    smoothIn: "power2.in",
    smoothInOut: "power2.inOut",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    sharp: "power3.out",
    sharpIn: "power3.in",
  },
  stagger: { small: 0.05, medium: 0.1, large: 0.2 },
  scrollTrigger: {
    start: "top 85%",
    end: "bottom 15%",
    toggleActions: "play none none reverse",
  },
} as const;

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

function getAnimationProperties(variant: AnimationVariant) {
  const properties: Record<
    AnimationVariant,
    { from: gsap.TweenVars; to: gsap.TweenVars }
  > = {
    fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
    fadeInUp: { from: { opacity: 0, y: 30 }, to: { opacity: 1, y: 0 } },
    fadeInDown: { from: { opacity: 0, y: -30 }, to: { opacity: 1, y: 0 } },
    fadeInLeft: { from: { opacity: 0, x: -30 }, to: { opacity: 1, x: 0 } },
    fadeInRight: { from: { opacity: 0, x: 30 }, to: { opacity: 1, x: 0 } },
    scaleIn: { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 } },
    scaleInUp: {
      from: { opacity: 0, scale: 0.8, y: 30 },
      to: { opacity: 1, scale: 1, y: 0 },
    },
    slideInUp: { from: { y: 100, opacity: 0 }, to: { y: 0, opacity: 1 } },
    slideInDown: { from: { y: -100, opacity: 0 }, to: { y: 0, opacity: 1 } },
    slideInLeft: { from: { x: -100, opacity: 0 }, to: { x: 0, opacity: 1 } },
    slideInRight: { from: { x: 100, opacity: 0 }, to: { x: 0, opacity: 1 } },
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

interface AnimateInProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

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
        if (trigger.vars.trigger === element) trigger.kill();
      });
    };
  }, [variant, delay, duration, once]);
  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

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
    const { from, to } = getAnimationProperties(variant);
    gsap.fromTo(
      container.children,
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
      { ...directions[direction], opacity: 0 },
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

interface TextRevealProps {
  text: string;
  className?: string;
}
export function TextReveal({ text, className = "" }: TextRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const words = text.split(" ");
    element.innerHTML = words
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
    <div ref={elementRef} className={className}>
      {text}
    </div>
  );
}

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

export { ScrollTrigger, gsap };
