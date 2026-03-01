"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoveLeft, Home, Sparkles, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function NotFound() {
    const container = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const router = useRouter();

    useGSAP(
        () => {
            // Background subtle particles animation
            const particles = gsap.utils.toArray(".particle") as HTMLElement[];
            particles.forEach((particle) => {
                gsap.to(particle, {
                    y: "random(-300, 300)",
                    x: "random(-300, 300)",
                    rotation: "random(-180, 180)",
                    scale: "random(0.3, 1.8)",
                    duration: "random(7, 15)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: "random(0, 3)",
                });
            });

            // Glitch and float effect on the main 404 text
            const tl = gsap.timeline({ repeat: -1, yoyo: true });
            tl.to(textRef.current, {
                y: -10,
                scale: 1.02,
                duration: 3,
                ease: "sine.inOut",
            });

            // Initial reveal
            gsap.fromTo(".reveal-element",
                {
                    y: 80,
                    opacity: 0,
                    scale: 0.95,
                },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.4,
                    stagger: 0.15,
                    ease: "power4.out",
                }
            );

            // Ambient background breathing
            gsap.to(".ambient-bg", {
                scale: 1.15,
                opacity: 0.95,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 0.5,
            });

            // Mouse movement tracking for interactive glow
            const onMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const xPos = (clientX / window.innerWidth - 0.5) * 60;
                const yPos = (clientY / window.innerHeight - 0.5) * 60;

                gsap.to(".interactive-glow", {
                    x: xPos,
                    y: yPos,
                    duration: 1.5,
                    ease: "power2.out",
                });
            };

            window.addEventListener("mousemove", onMouseMove);
            return () => window.removeEventListener("mousemove", onMouseMove);
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030303] text-white selection:bg-purple-500/30"
        >
            {/* Dynamic Background Gradients */}
            <div className="interactive-glow ambient-bg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none" />
            <div className="interactive-glow ambient-bg absolute top-0 right-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none delay-1000" />
            <div className="interactive-glow ambient-bg absolute bottom-0 left-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-600/25 rounded-full blur-[120px] pointer-events-none delay-2000" />
            
            {/* Fine noise overlay for texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay pointer-events-none"></div>

            {/* Floating Particles */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div
                        key={i}
                        className={`particle absolute rounded-full ${i % 3 === 0 ? "bg-white/30" : "bg-purple-400/20"} blur-[1px] ${i % 3 === 0 ? "w-2 h-2" : i % 2 === 0 ? "w-4 h-4 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "w-6 h-6"
                            }`}
                        style={{
                            top: `${(i * 13.51) % 100}%`,
                            left: `${(i * 27.83) % 100}%`,
                        }}
                    />
                ))}
            </div>

            <div className="z-10 flex flex-col items-center px-6 md:px-0 text-center max-w-3xl mx-auto">
                <div className="reveal-element inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-sm font-medium text-neutral-300 mb-6 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="tracking-wide">System Malfunction • Error 404</span>
                </div>

                {/* Enhanced 404 Type Design */}
                <div className="reveal-element relative flex items-center justify-center my-6 group" ref={textRef}>
                    {/* Pulsing neon underline */}
                    <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-[60%] h-4 bg-purple-500/50 blur-[20px] rounded-[100%] z-0" />
                    
                    {/* Shadow layer */}
                    <h1 className="absolute inset-0 z-0 text-transparent font-black text-[12rem] md:text-[20rem] leading-[0.8] tracking-tighter"
                        style={{ WebkitTextStroke: "6px rgba(255,255,255,0.05)" }}>
                        404
                    </h1>

                    {/* Main text layer with intense gradient and glass reflection */}
                    <h1 className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-500 font-black text-[12rem] md:text-[20rem] leading-[0.8] tracking-tighter drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_120px_rgba(168,85,247,0.4)] transition-all duration-700">
                        404
                    </h1>
                    
                    {/* Holographic interference overlay (on hover) */}
                    <div className="absolute inset-0 z-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                </div>

                <h2 className="reveal-element mt-6 md:mt-8 text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 mb-6">
                    Drifting in Space
                </h2>

                <p className="reveal-element max-w-xl text-neutral-400 text-lg md:text-xl md:leading-relaxed mb-12">
                    The quadrant you are looking for has vanished into the dark matter. 
                    Let&apos;s reroute your navigation coordinates and get you back home safely.
                </p>

                <div className="reveal-element flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
                    <button
                        onClick={() => router.back()}
                        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold text-white transition-all bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 hover:pr-10 overflow-hidden backdrop-blur-sm"
                    >
                        <MoveLeft className="w-4 h-4 text-neutral-400 transition-transform group-hover:-translate-x-1 group-hover:text-white" />
                        <span className="relative z-10">Retrace Steps</span>
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>

                    <Link
                        href="/"
                        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-[#030303] transition-all bg-white rounded-full hover:bg-neutral-200 hover:scale-[1.03] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] active:scale-95"
                    >
                        <Home className="w-4 h-4" />
                        <span>Return to Base</span>
                    </Link>
                </div>
                
                <div className="reveal-element mt-16 flex items-center gap-2 text-xs text-neutral-600 font-medium tracking-widest uppercase">
                    <AlertCircle className="w-3 h-3" />
                    <span>Connection Lost</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
        </div>
    );
}
