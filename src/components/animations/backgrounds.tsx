"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  color?: string;
}

export function ParticleBackground({
  className = "",
  particleCount = 50,
  color = "rgba(255, 255, 255, 0.5)",
}: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 4 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        opacity: ${Math.random() * 0.5 + 0.2};
      `;

      container.appendChild(particle);

      // Animate particle
      gsap.to(particle, {
        y: -100,
        x: Math.random() * 50 - 25,
        opacity: 0,
        duration,
        delay,
        repeat: -1,
        ease: "none",
      });
    }

    return () => {
      container.innerHTML = "";
    };
  }, [particleCount, color]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}

// Animated gradient background
interface GradientBackgroundProps {
  className?: string;
  colors?: string[];
  speed?: number;
}

export function GradientBackground({
  className = "",
  colors = [
    "rgba(99, 102, 241, 0.3)",
    "rgba(168, 85, 247, 0.3)",
    "rgba(236, 72, 153, 0.3)",
  ],
  speed = 10,
}: GradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.to(container, {
      backgroundPosition: "200% 200%",
      duration: speed,
      repeat: -1,
      ease: "none",
    });
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${colors.join(", ")})`,
        backgroundSize: "400% 400%",
      }}
    />
  );
}

// Animated grid background
interface GridBackgroundProps {
  className?: string;
  color?: string;
  spacing?: number;
}

export function GridBackground({
  className = "",
  color = "rgba(255, 255, 255, 0.05)",
  spacing = 50,
}: GridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const grid = document.createElement("div");
    grid.style.cssText = `
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(${color} 1px, transparent 1px),
        linear-gradient(90deg, ${color} 1px, transparent 1px);
      background-size: ${spacing}px ${spacing}px;
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    `;

    container.appendChild(grid);
  }, [color, spacing]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}

// Animated blob background
interface BlobBackgroundProps {
  className?: string;
}

export function BlobBackground({ className = "" }: BlobBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = [
      "rgba(99, 102, 241, 0.4)",
      "rgba(168, 85, 247, 0.4)",
      "rgba(236, 72, 153, 0.4)",
      "rgba(34, 211, 238, 0.4)",
    ];

    colors.forEach((color, index) => {
      const blob = document.createElement("div");
      const size = Math.random() * 300 + 200;
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      blob.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        filter: blur(80px);
        left: ${x}%;
        top: ${y}%;
        opacity: 0.6;
      `;

      container.appendChild(blob);

      // Animate blob
      gsap.to(blob, {
        x: `+=${Math.random() * 100 - 50}`,
        y: `+=${Math.random() * 100 - 50}`,
        scale: Math.random() * 0.5 + 1,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}

// Stars background
interface StarsBackgroundProps {
  className?: string;
  starCount?: number;
}

export function StarsBackground({
  className = "",
  starCount = 100,
}: StarsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 2;

      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        opacity: ${Math.random() * 0.5 + 0.3};
        box-shadow: 0 0 ${size * 2}px white;
      `;

      container.appendChild(star);

      // Twinkle effect
      gsap.to(star, {
        opacity: Math.random() * 0.3 + 0.1,
        duration,
        delay,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    return () => {
      container.innerHTML = "";
    };
  }, [starCount]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}

// Wave background
interface WaveBackgroundProps {
  className?: string;
  color?: string;
}

export function WaveBackground({
  className = "",
  color = "rgba(99, 102, 241, 0.2)",
}: WaveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    for (let i = 0; i < 3; i++) {
      const wave = document.createElement("div");
      const delay = i * 0.5;

      wave.style.cssText = `
        position: absolute;
        bottom: 0;
        left: -50%;
        width: 200%;
        height: 200px;
        background: ${color};
        border-radius: 50% 50% 0 0;
        opacity: ${0.3 - i * 0.1};
        transform: translateY(${i * 30}px);
      `;

      container.appendChild(wave);

      gsap.to(wave, {
        x: "25%",
        duration: 5 + i,
        delay,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, [color]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}

// Aurora effect
interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = [
      "rgba(34, 211, 238, 0.3)",
      "rgba(168, 85, 247, 0.3)",
      "rgba(99, 102, 241, 0.3)",
      "rgba(236, 72, 153, 0.2)",
    ];

    colors.forEach((color, index) => {
      const aurora = document.createElement("div");
      const size = Math.random() * 400 + 300;

      aurora.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        filter: blur(60px);
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0.5;
      `;

      container.appendChild(aurora);

      gsap.to(aurora, {
        borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: Math.random() * 10 + 15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}
