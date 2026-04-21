import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string, role: "MEMBER" | "ADMIN") => void;
  isPending: boolean;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Invite a member
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Enter the email of an existing user to invite them to this team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) {
              onSubmit(email.trim(), role);
              setEmail("");
            }
          }}
        >
          <div className="space-y-4 py-4 mb-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/30"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Role
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
                className="bg-background/50 border-border/50 focus:ring-primary/30"
              >
                <option value="MEMBER">Member — can view & comment</option>
                <option value="ADMIN">
                  Admin — can manage repos & members
                </option>
              </Select>
            </div>
          </div>
          <AlertDialogFooter className="sm:justify-between border-t border-border/40 pt-4">
            <AlertDialogAction
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 sm:flex-none"
            >
              Cancel
            </AlertDialogAction>
            <Button
              type="submit"
              disabled={!email.trim() || isPending}
              className="flex-1 sm:flex-none relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative inline-flex items-center">
                {isPending ? "Inviting..." : "Send Invite"}
              </span>
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ShareRepo {
  id: string;
  fullName: string;
  private: boolean;
}

interface ShareRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repos: ShareRepo[];
  onShare: (repoId: string) => void;
  isPending: boolean;
}

export function ShareRepoDialog({
  open,
  onOpenChange,
  repos,
  onShare,
  isPending,
}: ShareRepoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Share a repository
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Select one of your connected repositories to share with this team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-64 overflow-y-auto space-y-2 py-4 mb-2 pr-2">
          {repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-sm font-medium text-foreground">
                No repositories available
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                You don&apos;t own any repositories or they are all already
                shared.
              </p>
            </div>
          ) : (
            repos.map((repo) => (
              <button
                key={repo.id}
                className="group/sharebtn w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/60 hover:border-primary/30 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onShare(repo.id)}
                disabled={isPending}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover/sharebtn:text-primary transition-colors">
                    {repo.fullName}
                  </p>
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {repo.private ? "Private" : "Public"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        <AlertDialogFooter className="border-t border-border/40 pt-4">
          <AlertDialogAction className="w-full sm:w-auto">
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ActionType =
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_ROLE"
  | "SHARE_REPOSITORY"
  | "UNSHARE_REPOSITORY"
  | "DELETE_TEAM"
  | "REVIEW_PR"
  | "APPROVE_DISCUSSION";

interface RequestActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (actionType: ActionType) => void;
  isPending: boolean;
}

export function RequestActionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: RequestActionDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Request an Action
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80">
            Request an action that requires approval from a team administrator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4 mb-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Action Type
            </label>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-background/50 border-border/50 focus:ring-primary/30"
            >
              <option value="">Select an action...</option>
              <option value="INVITE_MEMBER">Invite Member</option>
              <option value="REMOVE_MEMBER">Remove Member</option>
              <option value="UPDATE_ROLE">Update Member Role</option>
              <option value="SHARE_REPOSITORY">Share Repository</option>
              <option value="UNSHARE_REPOSITORY">Unshare Repository</option>
              <option value="REVIEW_PR">Review PR</option>
              <option value="APPROVE_DISCUSSION">Approve Discussion</option>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Your request will be sent to team administrators for review.
          </p>
        </div>
        <AlertDialogFooter className="border-t border-border/40 pt-4">
          <AlertDialogAction
            type="button"
            onClick={() => {
              onOpenChange(false);
              setSelectedType("");
            }}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel
          </AlertDialogAction>
          <Button
            type="submit"
            disabled={!selectedType || isPending}
            onClick={() => {
              if (selectedType) {
                onSubmit(selectedType as ActionType);
                onOpenChange(false);
                setSelectedType("");
              }
            }}
            className="relative overflow-hidden group"
          >
            <span className="relative inline-flex items-center">
              {isPending ? "Submitting..." : "Submit Request"}
            </span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
