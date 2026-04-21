export interface CommitNode {
  sha: string;
  message: string;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  date: string;
  htmlUrl: string;
  parents: string[];
  branch?: string;
  branches?: string[];
  isMergeCommit?: boolean;
}

export interface Branch {
  name: string;
  sha: string;
  isProtected: boolean;
}

export const BRANCH_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

export function getBranchColor(branchName: string): string {
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS[Math.abs(hash) % BRANCH_COLORS.length];
}
