import {
  AuroraBackground,
  GridBackground,
} from "@/components/animations/backgrounds";

export function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Aurora effect */}
      <AuroraBackground />

      {/* Grid pattern overlay */}
      <GridBackground />

      {/* Animated orbs */}
      <div className="orb-1 absolute left-1/4 top-1/4 h-125 w-125 rounded-full bg-primary/8 blur-[120px] animate-pulse" />
      <div
        className="orb-2 absolute right-1/4 bottom-1/4 h-100 w-100 rounded-full bg-accent/6 blur-[100px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="orb-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-primary/3 blur-[150px] animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
    </div>
  );
}
