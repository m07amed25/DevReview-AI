"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { linkSocial } from "@/lib/auth-client";
import { CropDialog } from "@/components/crop-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, Pencil, X, Save, FolderGit2, GitPullRequest } from "lucide-react";
import {
  FaGithub, FaDiscord, FaLinkedin, FaTwitch, FaApple,
} from "react-icons/fa";
import { ProfileSkeleton } from "./profile-skeleton";
import { PersonalInfoCard } from "./profile-cards";
import { ConnectedAccountsCard } from "./connected-accounts";

const ALL_PROVIDERS = [
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

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: availableProviders } = trpc.profile.availableProviders.useQuery();

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

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [disconnectTarget, setDisconnectTarget] = useState<{ accountId: string; providerName: string } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      const messages: Record<string, string> = {
        account_already_linked_to_different_user: "This social account is already linked to a different user.",
        "email_doesn't_match": "The email on the social account doesn\u2019t match your profile email.",
      };
      setErrorMessage(messages[authError] ?? `Authentication error: ${authError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const providers = ALL_PROVIDERS.filter(
    (p) => availableProviders?.includes(p.id) ?? p.id === "github",
  );

  const handleStartEdit = () => {
    setEditName(profile?.name ?? "");
    setEditEmail(profile?.email ?? "");
    setEditImage(profile?.image ?? "");
    setIsEditing(true);
    setErrorMessage(null);
    setSaveMessage(null);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    if (!editName.trim()) { setErrorMessage("Name is required."); return; }
    const updates: { name?: string; email?: string; image?: string } = {};
    let hasChanges = false;
    if (editName.trim() !== profile?.name) { updates.name = editName.trim(); hasChanges = true; }
    if (editEmail.trim() !== profile?.email) { updates.email = editEmail.trim(); hasChanges = true; }
    if (editImage.trim() !== (profile?.image ?? "")) { updates.image = editImage.trim(); hasChanges = true; }
    if (!hasChanges) { setIsEditing(false); return; }
    updateProfile.mutate(updates);
  };

  const handleCancel = () => { setIsEditing(false); setErrorMessage(null); };

  const handleConnectProvider = async (providerId: string) => {
    setConnectingProvider(providerId);
    try {
      const result = await linkSocial({
        provider: providerId as "github" | "discord" | "linkedin" | "twitch" | "apple",
        callbackURL: window.location.href,
      });
      if (result?.error) {
        setErrorMessage(result.error.message || `Failed to connect ${providerId}. The provider may not be configured.`);
        setTimeout(() => setErrorMessage(null), 5000);
        setConnectingProvider(null);
      }
      setTimeout(() => setConnectingProvider(null), 5000);
    } catch (error) {
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

  const handleAvatarFileSelected = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
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
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCropDialogOpen(true);
  };

  const handleCroppedUpload = useCallback(
    (blob: Blob) => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setIsUploading(true);
      setUploadProgress(0);
      setErrorMessage(null);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            if (isEditing) setEditImage(data.url);
            else updateProfile.mutate({ image: data.url });
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to upload photo.");
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and connected accounts.</p>
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
        <p className="text-muted-foreground">We couldn&apos;t retrieve your profile information. Please try again later.</p>
      </div>
    );
  }

  const displayName = isEditing ? editName : profile.name;
  const hasPassword = profile.accounts.some((a) => a.providerId === "credential");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and connected accounts.</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={handleStartEdit} className="gap-2">
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={updateProfile.isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateProfile.isPending || !editName.trim()} className="gap-2">
              {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
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
        {/* Profile Header Card - avatar + name + email + joined date */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar (inline to access upload state) */}
              <div className="relative group">
                <div
                  className="size-20 rounded-full ring-2 ring-border shadow-md bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary overflow-hidden cursor-pointer"
                  onClick={() => document.getElementById("avatar-file-input")?.click()}
                >
                  {(isEditing ? editImage : profile.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={isEditing ? editImage : (profile.image ?? "")} alt={displayName} className="size-full object-cover" />
                  ) : (
                    displayName ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                      <circle
                        cx="40" cy="40" r="36" fill="none" stroke="white" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - uploadProgress / 100)}`}
                        className="transition-all duration-200 ease-out"
                      />
                    </svg>
                    <span className="absolute text-xs font-semibold text-white">{uploadProgress}%</span>
                  </div>
                )}
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFileSelected(f); e.target.value = ""; }}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">{displayName || "User"}</h2>
                <p className="text-sm text-muted-foreground mt-1 truncate">{isEditing ? editEmail : profile.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
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
                  <p className="text-2xl font-bold">{profile.stats.repositories}</p>
                  <p className="text-xs text-muted-foreground">Connected Repositories</p>
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

        {/* Personal Information */}
        <PersonalInfoCard
          profile={profile}
          isEditing={isEditing}
          editName={editName}
          editEmail={editEmail}
          editImage={editImage}
          setEditName={setEditName}
          setEditEmail={setEditEmail}
          setEditImage={setEditImage}
          nameInputRef={nameInputRef}
          onSave={handleSave}
          onCancel={handleCancel}
          isPending={updateProfile.isPending}
        />

        {/* Connected Accounts */}
        <ConnectedAccountsCard
          accounts={profile.accounts}
          providers={providers}
          connectingProvider={connectingProvider}
          disconnectTarget={disconnectTarget}
          setDisconnectTarget={setDisconnectTarget}
          onConnect={handleConnectProvider}
          onDisconnect={handleDisconnect}
          isDisconnecting={disconnectAccount.isPending}
          hasPassword={hasPassword}
        />
      </div>

      {/* Image Crop Dialog */}
      {cropSrc && (
        <CropDialog
          src={cropSrc}
          open={cropDialogOpen}
          onOpenChange={(open: boolean) => {
            setCropDialogOpen(open);
            if (!open && cropSrc) { URL.revokeObjectURL(cropSrc); setCropSrc(null); }
          }}
          outputSize={512}
          onCrop={handleCroppedUpload}
        />
      )}
    </div>
  );
}
