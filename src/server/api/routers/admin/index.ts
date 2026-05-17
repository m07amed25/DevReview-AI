import { mergeRouters } from "../../trpc";
import { adminStatsRouter } from "./stats";
import { adminUsersRouter } from "./users";
import { adminReviewsRouter } from "./reviews";
import { adminSettingsRouter } from "./settings";
import { adminSecurityRouter } from "./security";

export const adminRouter = mergeRouters(
  adminStatsRouter,
  adminUsersRouter,
  adminReviewsRouter,
  adminSettingsRouter,
  adminSecurityRouter,
);
