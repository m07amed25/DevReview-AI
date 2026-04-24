"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wifi, WifiOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PresenceMember } from "@/lib/pusher/client";

interface PresenceAvatarsProps {
  members: PresenceMember[];
  myId: string | null;
  isAdmin?: boolean;
}

export function PresenceAvatars({
  members,
  myId,
  isAdmin,
}: PresenceAvatarsProps) {
  if (members.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50 shadow-sm">
        <WifiOff className="size-3.5" />
        <span className="font-medium">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm ring-1 ring-background/5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <div className="relative flex items-center justify-center size-4">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30" />
          <Wifi className="size-3.5 text-emerald-500 relative z-10" />
        </div>
      </div>
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <Avatar
            key={m.id}
            className={cn(
              "size-7 ring-2 ring-background transition-transform hover:scale-110 hover:z-10",
              m.id === myId && "ring-primary/50",
            )}
            title={m.info.name + (m.id === myId ? " (you)" : "")}
          >
            <AvatarImage src={m.info.image ?? undefined} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10">
              {m.info.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {members.length > 5 && (
          <div className="size-7 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground shadow-sm">
            +{members.length - 5}
          </div>
        )}
      </div>
      <div className="h-4 w-px bg-border/60 mx-1" />
      {isAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors tabular-nums focus:outline-none flex items-center gap-1 cursor-pointer">
              {members.length} online
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2" sideOffset={8}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Online Members
            </div>
            <div className="space-y-1">
              {members.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  className="gap-2.5 rounded-md px-2 py-1.5 focus:bg-muted cursor-default"
                >
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={m.info.image ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-primary/10">
                      {m.info.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">
                    {m.info.name}{" "}
                    {m.id === myId && (
                      <span className="text-muted-foreground opacity-70">
                        (you)
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          {members.length} online
        </span>
      )}
    </div>
  );
}
