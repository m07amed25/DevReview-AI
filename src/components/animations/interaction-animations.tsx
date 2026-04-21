"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ANIMATION } from "./entrance-animations";

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
    const handleMouseEnter = () =>
      gsap.to(element, {
        scale,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    const handleMouseLeave = () =>
      gsap.to(element, {
        scale: 1,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
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
      ripple.style.cssText = `position:absolute;background:${color};border-radius:50%;pointer-events:none;width:20px;height:20px;left:${x - 10}px;top:${y - 10}px;transform:scale(0);opacity:1;`;
      element.appendChild(ripple);
      gsap.to(ripple, {
        scale: 20,
        opacity: 0,
        duration: ANIMATION.duration.slow,
        ease: ANIMATION.ease.smoothInOut,
        onComplete: () => ripple.remove(),
      });
    };
    element.addEventListener("click", handleClick);
    return () => element.removeEventListener("click", handleClick);
  }, [color]);
  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

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
    const handleMouseEnter = () =>
      gsap.to(element, {
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
    const handleMouseLeave = () =>
      gsap.to(element, {
        boxShadow: "none",
        duration: ANIMATION.duration.fast,
        ease: ANIMATION.ease.smooth,
      });
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
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });
  }, [end, duration]);
  return <span ref={elementRef} className={className} />;
}

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
    shimmer.style.cssText = `position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);transform:skewX(-20deg);`;
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
