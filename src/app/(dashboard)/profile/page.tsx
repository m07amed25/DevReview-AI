"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { linkSocial } from "@/lib/auth-client";
import { CropDialog } from "@/components/crop-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Calendar,
  FolderGit2,
  GitPullRequest,
  Loader2,
  Check,
  Pencil,
  X,
  Camera,
  Save,
  ImageIcon,
  Shield,
  ExternalLink,
  Unlink,
} from "lucide-react";
import {
  FaGithub,
  FaDiscord,
  FaLinkedin,
  FaTwitch,
  FaApple,
} from "react-icons/fa";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Banner skeleton */}
      <div className="relative">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="absolute -bottom-12 left-6">
          <Skeleton className="size-24 rounded-full ring-4 ring-background" />
        </div>
      </div>
      <div className="pt-14">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: availableProviders } =
    trpc.profile.availableProviders.useQuery();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      setIsEditing(false);
      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pick up auth errors from URL (e.g. after a failed provider link redirect)
  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      const messages: Record<string, string> = {
        account_already_linked_to_different_user:
          "This social account is already linked to a different user.",
        "email_doesn't_match":
          "The email on the social account doesn\u2019t match your profile email.",
      };
      setErrorMessage(
        messages[authError] ?? `Authentication error: ${authError}`,
      );
      // Clean the URL without triggering a navigation
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    accountId: string;
    providerName: string;
  } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const disconnectAccount = trpc.profile.disconnectAccount.useMutation({
    onSuccess: (data) => {
      setSaveMessage(`Successfully disconnected ${data.providerId}.`);
      setTimeout(() => setSaveMessage(null), 3000);
      void utils.profile.get.invalidate();
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const allProviders = [
    {
      id: "github" as const,
      name: "GitHub",
      icon: FaGithub,
      color: "bg-gray-900 dark:bg-white/10",
      textColor: "text-white",
      description: "Access repositories, pull requests, and code reviews.",
    },
    {
      id: "discord" as const,
      name: "Discord",
      icon: FaDiscord,
      color: "bg-[#5865F2]",
      textColor: "text-white",
      description: "Connect your Discord account for notifications.",
    },
    {
      id: "linkedin" as const,
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-[#0A66C2]",
      textColor: "text-white",
      description: "Link your professional profile.",
    },
    {
      id: "twitch" as const,
      name: "Twitch",
      icon: FaTwitch,
      color: "bg-[#9146FF]",
      textColor: "text-white",
      description: "Connect your Twitch streaming account.",
    },
    {
      id: "apple" as const,
      name: "Apple",
      icon: FaApple,
      color: "bg-black dark:bg-white/10",
      textColor: "text-white",
      description: "Sign in with your Apple ID.",
    },
  ];

  // Only show providers that are actually configured on the server
  const providers = allProviders.filter(
    (p) => availableProviders?.includes(p.id) ?? p.id === "github",
  );

  const handleStartEdit = () => {
    setEditName(profile?.name ?? "");
    setEditEmail(profile?.email ?? "");
    setEditImage(profile?.image ?? "");
    setIsEditing(true);
    setErrorMessage(null);
    setSaveMessage(null);
    // Focus name input after render
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    if (!editName.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    const updates: { name?: string; email?: string; image?: string } = {};
    let hasChanges = false;

    if (editName.trim() !== profile?.name) {
      updates.name = editName.trim();
      hasChanges = true;
    }
    if (editEmail.trim() !== profile?.email) {
      updates.email = editEmail.trim();
      hasChanges = true;
    }
    const currentImage = profile?.image ?? "";
    if (editImage.trim() !== currentImage) {
      updates.image = editImage.trim();
      hasChanges = true;
    }

    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    updateProfile.mutate(updates);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleConnectProvider = async (providerId: string) => {
    setConnectingProvider(providerId);
    try {
      const result = await linkSocial({
        provider: providerId as
          | "github"
          | "discord"
          | "linkedin"
          | "twitch"
          | "apple",
        callbackURL: window.location.href,
      });
      // If linkSocial returns an error instead of redirecting, handle it
      if (result?.error) {
        console.error(`Failed to connect ${providerId}:`, result.error);
        setErrorMessage(
          result.error.message ||
            `Failed to connect ${providerId}. The provider may not be configured.`,
        );
        setTimeout(() => setErrorMessage(null), 5000);
        setConnectingProvider(null);
      }
      // If we're still here after 5s (redirect didn't happen), reset loading
      setTimeout(() => setConnectingProvider(null), 5000);
    } catch (error) {
      console.error(`Failed to connect ${providerId}:`, error);
      setErrorMessage(`Failed to connect ${providerId}. Please try again.`);
      setTimeout(() => setErrorMessage(null), 5000);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = () => {
    if (!disconnectTarget) return;
    disconnectAccount.mutate({ accountId: disconnectTarget.accountId });
    setDisconnectTarget(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File too large. Maximum size is 5MB.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Open crop dialog with a preview URL of the selected file
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCropDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedUpload = useCallback(
    (blob: Blob) => {
      // Clean up the object URL
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);

      setIsUploading(true);
      setUploadProgress(0);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            if (isEditing) {
              setEditImage(data.url);
            } else {
              updateProfile.mutate({ image: data.url });
            }
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to upload photo.",
          );
          setTimeout(() => setErrorMessage(null), 5000);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      });

      xhr.addEventListener("error", () => {
        setErrorMessage("Network error during upload.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    },
    [cropSrc, isEditing, updateProfile],
  );

  const displayImage = isEditing ? editImage : (profile?.image ?? "");
  const displayName = isEditing ? editName : (profile?.name ?? "");

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and connected accounts.
          </p>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-destructive/10 mb-4">
          <X className="size-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Unable to Load Profile</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t retrieve your profile information. Please try again
          later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and connected accounts.
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={handleStartEdit} className="gap-2">
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || !editName.trim()}
              className="gap-2"
            >
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Toast Messages */}
      {saveMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="size-4 shrink-0" />
          {saveMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <X className="size-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with upload */}
              <div className="relative group">
                <Avatar className="size-20 ring-2 ring-border shadow-md">
                  <AvatarImage
                    src={displayImage || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Upload progress ring */}
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
                {/* Hover overlay */}
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
                  onChange={handleAvatarUpload}
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

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-md bg-violet-500/10">
                  <FolderGit2 className="size-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profile.stats.repositories}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connected Repositories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-md bg-pink-500/10">
                  <GitPullRequest className="size-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.stats.reviews}</p>
                  <p className="text-xs text-muted-foreground">Code Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information — Editable */}
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
              {/* Name */}
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

              {/* Email */}
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

              {/* Avatar URL */}
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
                        <AvatarFallback className="text-[10px]">
                          ?
                        </AvatarFallback>
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

              {/* Member Since — always read-only */}
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Member Since
                </Label>
                <p className="text-sm font-medium">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            {/* Bottom save/cancel for long forms */}
            {isEditing && (
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateProfile.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending || !editName.trim()}
                  className="gap-2"
                >
                  {updateProfile.isPending ? (
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

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Connected Accounts
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage your linked third-party accounts for authentication and
                  integrations.
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
                {profile?.accounts.filter((a) => a.providerId !== "credential")
                  .length ?? 0}{" "}
                / {providers.length} connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6 space-y-3">
            {providers.map((provider) => {
              const account = profile?.accounts.find(
                (a) => a.providerId === provider.id,
              );
              const isConnected = !!account;
              const isConnecting = connectingProvider === provider.id;
              const Icon = provider.icon;

              return (
                <div
                  key={provider.id}
                  className={`group relative flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isConnected
                      ? "bg-card border-green-500/20 dark:border-green-500/10"
                      : "bg-muted/30 border-dashed hover:border-solid hover:bg-muted/50"
                  }`}
                >
                  {/* Status dot */}
                  {isConnected && (
                    <div className="absolute top-3 right-3 sm:hidden">
                      <span className="relative flex size-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2.5 bg-green-500" />
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex shrink-0 items-center justify-center size-10 rounded-lg ${provider.color} transition-transform group-hover:scale-105`}
                    >
                      <Icon className={`size-5 ${provider.textColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{provider.name}</p>
                        {isConnected && (
                          <span className="hidden sm:inline-flex relative shrink-0">
                            <span className="relative flex size-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full size-2 bg-green-500" />
                            </span>
                          </span>
                        )}
                      </div>
                      {isConnected ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            Connected{" "}
                            {account.createdAt
                              ? `on ${formatDate(account.createdAt)}`
                              : ""}
                          </p>
                          {account.updatedAt && (
                            <p className="text-xs text-muted-foreground/60 hidden sm:block">
                              · Last synced {formatDate(account.updatedAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {isConnected ? (
                      <>
                        <Badge
                          variant="secondary"
                          className="hidden sm:flex gap-1 text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                        >
                          <Check className="size-3" />
                          Connected
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                          onClick={() =>
                            setDisconnectTarget({
                              accountId: account.id,
                              providerName: provider.name,
                            })
                          }
                          title={`Disconnect ${provider.name}`}
                        >
                          <Unlink className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnectProvider(provider.id)}
                        disabled={isConnecting}
                        className="gap-2"
                      >
                        {isConnecting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <ExternalLink className="size-3.5" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <Separator className="my-2" />

            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
              <Shield className="size-3.5 mt-0.5 shrink-0" />
              <p>
                Your account credentials are securely stored and encrypted.
                Disconnecting a provider will revoke its access but won&apos;t
                delete any data already synced.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Crop Dialog */}
      {cropSrc && (
        <CropDialog
          src={cropSrc}
          open={cropDialogOpen}
        onOpenChange={(open: boolean) => {
          setCropDialogOpen(open);
          if (!open && cropSrc) {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }
        }}
          outputSize={512}
          onCrop={handleCroppedUpload}
        />
      )}

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          {(() => {
            const hasPassword = profile?.accounts.some(
              (a) => a.providerId === "credential",
            );
            const otherProviders =
              profile?.accounts.filter(
                (a) =>
                  a.providerId !== "credential" &&
                  a.id !== disconnectTarget?.accountId,
              ) ?? [];
            const isOnlyAuthMethod =
              !hasPassword && otherProviders.length === 0;

            return isOnlyAuthMethod ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
                    <Shield className="size-5" />
                    Can&apos;t Disconnect {disconnectTarget?.providerName}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="block">
                      {disconnectTarget?.providerName} is your only way to sign
                      in. Disconnecting it would lock you out of your account.
                    </span>
                    <span className="block mt-2">
                      To remove this connection, you can delete your account
                      from the Settings page.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setDisconnectTarget(null);
                      router.push("/settings#danger-zone");
                    }}
                  >
                    Go to Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Disconnect {disconnectTarget?.providerName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your {disconnectTarget?.providerName}{" "}
                    connection. You won&apos;t be able to sign in with{" "}
                    {disconnectTarget?.providerName} until you reconnect it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDisconnect}
                  >
                    {disconnectAccount.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Unlink className="size-4 mr-2" />
                    )}
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
