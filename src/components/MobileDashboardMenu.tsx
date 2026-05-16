"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, Terminal, Cpu, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./ui/logo";

interface MobileDashboardMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  menuItems: any[];
}

export function MobileDashboardMenu({
  isOpen,
  onClose,
  user,
  menuItems,
}: MobileDashboardMenuProps) {
  const pathname = usePathname();

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.07,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20, filter: "blur(5px)" },
    open: { opacity: 1, x: 0, filter: "blur(0px)" },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 md:hidden overflow-hidden"
        >
          {/* Technical Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "120px 120px",
              }}
            />
          </div>

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between px-6 h-16 shrink-0 border-b border-white/[0.03] bg-zinc-950/50 backdrop-blur-md">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2 group"
            >
              <Logo className="h-6 group-hover:rotate-[360deg] transition-transform duration-1000" />
              <div className="flex flex-col -space-y-1">
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                  System
                </span>
                <span className="text-sm font-black tracking-tighter uppercase italic text-white">
                  Catch<span className="text-zinc-500">_OS</span>
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-10 scrollbar-hide">
            {menuItems.map((group, groupIdx) => (
              <div key={group.section} className="mb-10 last:mb-0">
                <motion.h3
                  variants={itemVariants}
                  className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"
                >
                  <span className="size-1 bg-indigo-500 rounded-full animate-pulse" />
                  {group.section}
                </motion.h3>
                <div className="space-y-3">
                  {group.items.map((item: any) => {
                    const Icon = item.icon || Terminal;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href.split("?")[0]}/`);

                    return (
                      <motion.div key={item.href} variants={itemVariants}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                            isActive
                              ? "bg-white/5 border-white/10 text-white"
                              : "bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "size-10 rounded-lg flex items-center justify-center transition-all duration-500",
                                isActive
                                  ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                  : "bg-zinc-900 text-zinc-600 group-hover:text-zinc-300",
                              )}
                            >
                              <Icon className="size-5" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                              {item.label}
                            </span>
                          </div>
                          <ArrowRight
                            className={cn(
                              "size-4 transition-all duration-500",
                              isActive
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-4",
                            )}
                          />

                          {/* Active Indicator Scanline */}
                          {isActive && (
                            <motion.div
                              layoutId="active-nav-glow"
                              className="absolute inset-0 rounded-xl ring-1 ring-white/20 pointer-events-none"
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Account Console */}
          <motion.div
            variants={itemVariants}
            className="relative z-10 p-6 bg-zinc-950 border-t border-white/[0.03]"
          >
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative size-12 rounded-xl bg-zinc-800 overflow-hidden border border-white/10 flex items-center justify-center">
                  <Fingerprint className="size-6 text-zinc-600 animate-pulse" />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 to-transparent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-zinc-600 uppercase tracking-tighter">
                    Auth ID: {user?.id?.slice(0, 8)}
                  </span>
                  <span className="text-sm font-bold text-white tracking-tight">
                    {user?.name}
                  </span>
                </div>
              </div>
              <Link
                href="/settings"
                onClick={onClose}
                className="size-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <Cpu className="size-5" />
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <span className="size-1 bg-green-500 rounded-full" /> Online
                </span>
                <span>V1.0.4-β</span>
              </div>
              <Link
                href="/pricing"
                onClick={onClose}
                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                Upgrade Pro
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
