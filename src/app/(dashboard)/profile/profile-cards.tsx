"use client";

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
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
  stats: { repositories: number; reviews: number };
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
    <Card>
      <CardContent className="py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <Avatar className="size-20 ring-2 ring-border shadow-md">
              <AvatarImage src={displayImage || undefined} alt={displayName} />
              <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="rgba(0,0,0,0.45)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - uploadProgress / 100)}`}
                    className="transition-all duration-200 ease-out"
                  />
                </svg>
                <span className="absolute text-xs font-semibold text-white">
                  {uploadProgress}%
                </span>
              </div>
            )}
            {!isUploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Upload avatar photo"
              >
                <Camera className="size-5 text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold truncate">
                {displayName || "User"}
              </h2>
              {!isEditing && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  Pro
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">
                {isEditing ? editEmail : profile.email}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" />
              <span>Joined {formatDate(profile.createdAt)}</span>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4" />
          Personal Information
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your personal details below."
            : "Your account details."}
        </CardDescription>
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
