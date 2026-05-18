"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { linkSocial } from "@/lib/auth-client";
import { CropDialog } from "@/features/profile/components/crop-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Check,
  Pencil,
  X,
  Save,
  FolderGit2,
  GitPullRequest,
} from "lucide-react";
import {
  FaGithub,
  FaDiscord,
  FaLinkedin,
  FaTwitch,
  FaApple,
} from "react-icons/fa";
import { ProfileSkeleton } from "./profile-skeleton";
import { PersonalInfoCard, ProfileHeaderCard } from "./profile-cards";
import { ConnectedAccountsCard } from "./connected-accounts";
import { SubscriptionCard } from "./subscription-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: availableProviders } =
    trpc.profile.availableProviders.useQuery();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const disconnectAccount = trpc.profile.disconnectAccount.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully disconnected ${data.providerId}.`);
      void utils.profile.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    accountId: string;
    providerName: string;
  } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      const messages: Record<string, string> = {
        account_already_linked_to_different_user:
          "This social account is already linked to a different user.",
        "email_doesn't_match":
          "The email on the social account doesn\u2019t match your profile email.",
      };
      toast.error(messages[authError] ?? `Authentication error: ${authError}`);
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
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error("Name is required.");
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
    if (editImage.trim() !== (profile?.image ?? "")) {
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
      if (result?.error) {
        toast.error(
          result.error.message ||
            `Failed to connect ${providerId}. The provider may not be configured.`,
        );
        setConnectingProvider(null);
      }
      setTimeout(() => setConnectingProvider(null), 5000);
    } catch (error) {
      toast.error(`Failed to connect ${providerId}. Please try again.`);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = () => {
    if (!disconnectTarget) return;
    disconnectAccount.mutate({ accountId: disconnectTarget.accountId });
    setDisconnectTarget(null);
  };

  const handleAvatarFileSelected = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
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
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            if (isEditing) setEditImage(data.url);
            else updateProfile.mutate({ image: data.url });
          } else {
            throw new Error(data.message || "Failed to upload photo.");
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to upload photo.",
          );
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      });
      xhr.addEventListener("error", () => {
        toast.error("Network error during upload.");
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

  const displayName = isEditing ? editName : profile.name;
  const hasPassword = profile.accounts.some(
    (a) => a.providerId === "credential",
  );

  return (
    <div className="min-h-screen pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Profile Header / Hero */}
        <ProfileHeaderCard
          profile={profile}
          isEditing={isEditing}
          editName={editName}
          editEmail={editEmail}
          editImage={editImage}
          setEditName={setEditName}
          setEditImage={setEditImage}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onAvatarFileSelected={handleAvatarFileSelected}
          nameInputRef={nameInputRef}
        />

        {/* Status Bar / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/50">
              Account Command Center
            </h2>
            <div className="h-px w-12 bg-border" />
          </div>

          {!isEditing ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="rounded-full px-6 bg-background/50 backdrop-blur-md border-border/50 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-300 shadow-lg group"
              >
                <Pencil className="size-4 mr-2 group-hover:rotate-12 transition-transform" />
                Edit Account
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending || !editName.trim()}
                className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area - Identity & Connections */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
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
            </motion.div>
          </div>

          {/* Sidebar Area - Subscription & Quotas */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="h-full"
            >
              <SubscriptionCard
                plan={profile.plan}
                limits={profile.limits}
                stats={profile.stats}
                planExpiresAt={profile.planExpiresAt}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Image Crop Dialog */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
