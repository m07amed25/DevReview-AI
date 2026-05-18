"use client";

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Plan } from "@/lib/plan";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Check,
  Pencil,
  X,
  Camera,
  Save,
  ImageIcon,
} from "lucide-react";
import { CropDialog } from "@/features/profile/components/crop-dialog";

interface Profile {
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date | string;
  plan: { id: string; name: string; accentColor: string };
  stats: { repositories: number; reviews: number; teamMembers: number };
  accounts: Array<{
    id: string;
    providerId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }>;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProfileHeaderCardProps {
  profile: Profile;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  editImage: string;
  setEditName: (v: string) => void;
  setEditImage: (v: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  onAvatarFileSelected: (file: File) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProfileHeaderCard({
  profile,
  isEditing,
  editName,
  editEmail,
  editImage,
  setEditName: _setEditName,
  setEditImage,
  isUploading,
  uploadProgress,
  onAvatarFileSelected,
  nameInputRef: _nameInputRef,
}: ProfileHeaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = isEditing ? editImage : (profile.image ?? "");
  const displayName = isEditing ? editName : profile.name;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarFileSelected(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md mb-8 overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <Avatar className="size-32 sm:size-36 ring-4 ring-background shadow-2xl border-none">
                <AvatarImage
                  src={displayImage || undefined}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl font-semibold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm z-10"
                  >
                    <div className="relative size-16">
                      <svg className="size-16 -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="white"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 36 * (1 - uploadProgress / 100),
                          }}
                          className="transition-all duration-300 ease-out"
                        />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-1 right-1 size-9 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-colors z-20"
                aria-label="Upload avatar photo"
              >
                <Camera className="size-4" />
              </motion.button>
            </motion.div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                {displayName || "User"}
              </h1>
              <Badge
                className={cn(
                  "w-fit mx-auto sm:mx-0 text-[10px] px-2 py-0.5 h-5 font-semibold uppercase tracking-widest border-none",
                  (() => {
                    const colorMap: Record<string, string> = {
                      slate: "bg-slate-500 text-white",
                      indigo: "bg-indigo-600 text-white",
                      amber:
                        "bg-linear-to-r from-amber-500 to-orange-500 text-white",
                      rose: "bg-rose-500 text-white",
                      emerald: "bg-emerald-500 text-white",
                      violet: "bg-violet-600 text-white",
                      blue: "bg-blue-600 text-white",
                    };
                    return (
                      colorMap[profile.plan.accentColor] ||
                      "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    );
                  })(),
                )}
              >
                {profile.plan.name} Plan
              </Badge>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                  <Mail className="size-3.5" />
                </div>
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                  <Calendar className="size-3.5" />
                </div>
                Member since {formatDate(profile.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PersonalInfoCardProps {
  profile: Profile;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  editImage: string;
  setEditName: (v: string) => void;
  setEditEmail: (v: string) => void;
  setEditImage: (v: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function PersonalInfoCard({
  profile,
  isEditing,
  editName,
  editEmail,
  editImage,
  setEditName,
  setEditEmail,
  setEditImage,
  nameInputRef,
  onSave,
  onCancel,
  isPending,
}: PersonalInfoCardProps) {
  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <User className="size-4" />
              </div>
              Identity
            </CardTitle>
            <CardDescription>
              Personal details and account appearance
            </CardDescription>
          </div>
          {!isEditing && (
            <div className="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Check className="size-5" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label
              htmlFor="profile-name"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Full Name
            </Label>
            {isEditing ? (
              <Input
                ref={nameInputRef}
                id="profile-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                className="max-w-md"
              />
            ) : (
              <p className="text-sm font-medium">{profile.name}</p>
            )}
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label
              htmlFor="profile-email"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Email Address
            </Label>
            {isEditing ? (
              <Input
                id="profile-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="your@email.com"
                className="max-w-md"
              />
            ) : (
              <p className="text-sm font-medium">{profile.email}</p>
            )}
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label
              htmlFor="profile-image"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Avatar URL
            </Label>
            {isEditing ? (
              <div className="flex items-center gap-3 max-w-md">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="profile-image"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="pl-9"
                  />
                </div>
                {editImage && (
                  <Avatar className="size-9 ring-1 ring-border shrink-0">
                    <AvatarImage src={editImage} alt="Preview" />
                    <AvatarFallback className="text-[10px]">?</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium truncate text-muted-foreground">
                {profile.image ? (
                  <span className="font-mono text-xs">{profile.image}</span>
                ) : (
                  <span className="italic">No custom avatar set</span>
                )}
              </p>
            )}
          </div>

          <Separator />

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Member Since
            </Label>
            <p className="text-sm font-medium">
              {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="ghost" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={isPending || !editName.trim()}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
