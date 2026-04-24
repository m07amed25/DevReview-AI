"use client";

import { Check, Moon, Monitor, Sun } from "lucide-react";

type ThemeOption = "light" | "dark" | "system";

type ThemeSelectorProps = {
  theme?: string;
  onThemeChange: (newTheme: ThemeOption, event?: React.MouseEvent) => void;
};

const themeOptions: Array<{
  id: ThemeOption;
  label: string;
  icon: typeof Sun;
  desc: string;
}> = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
    desc: "Bright & clean",
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    desc: "Easy on the eyes",
  },
  {
    id: "system",
    label: "System",
    icon: Monitor,
    desc: "Follows your OS",
  },
];

export default function ThemeSelector({
  theme,
  onThemeChange,
}: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {themeOptions.map((t) => {
        const isActive = theme === t.id;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            onClick={(e) => onThemeChange(t.id, e)}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
              isActive
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent bg-muted/40 hover:bg-muted/60"
            }`}
          >
            {isActive && (
              <div className="absolute top-2 right-2">
                <Check className="size-4 text-primary" />
              </div>
            )}
            <div
              className={`flex items-center justify-center size-10 rounded-lg ${
                isActive ? "bg-primary/10" : "bg-muted"
              }`}
            >
              <Icon
                className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}
              >
                {t.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

