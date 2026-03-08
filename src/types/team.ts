// Team role types
export type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

// Team action types for approval workflow
export type TeamActionType =
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_ROLE"
  | "SHARE_REPOSITORY"
  | "UNSHARE_REPOSITORY"
  | "DELETE_TEAM"
  | "REVIEW_PR"
  | "APPROVE_DISCUSSION";

// Team action status
export type TeamActionStatus = "PENDING" | "APPROVED" | "REJECTED";

// Team member preview for avatar display
export interface TeamMemberPreview {
  id: string;
  name: string;
  image: string | null;
}

// Full team member with details
export interface TeamMember {
  id: string;
  role: TeamRole;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

// Team repository
export interface TeamRepository {
  id: string;
  fullName: string;
  private: boolean;
}

// Pending action for approval workflow
export interface PendingAction {
  id: string;
  actionType: TeamActionType;
  status: TeamActionStatus;
  createdAt: Date;
  metadata?: Record<string, unknown>;
  team?: {
    id: string;
    name: string;
  };
}

// Team data structure from API
export interface TeamData {
  id: string;
  name: string;
  slug: string;
  role: TeamRole;
  memberCount: number;
  repoCount: number;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  currentUserRole?: TeamRole;
  members?: TeamMember[];
  repositories?: TeamRepository[];
}

// Action types that require approval when requested by MEMBER role
export const ACTIONS_REQUIRING_APPROVAL: TeamActionType[] = [
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "UPDATE_ROLE",
  "SHARE_REPOSITORY",
  "UNSHARE_REPOSITORY",
  "DELETE_TEAM",
] as const;

// Role display names
export const ROLE_DISPLAY_NAMES: Record<TeamRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

// Role permissions
export const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  OWNER: [
    "manage_team",
    "manage_members",
    "manage_repositories",
    "delete_team",
  ],
  ADMIN: ["manage_members", "manage_repositories"],
  MEMBER: ["view_team", "view_repositories", "create_reviews"],
};
