import { mergeRouters } from "../../trpc";
import { adminStatsRouter } from "./stats";
import { adminUsersRouter } from "./users";
import { adminReviewsRouter } from "./reviews";
import { adminSettingsRouter } from "./settings";
import { adminSecurityRouter } from "./security";
import { adminLegalRouter } from "./legal";

export const adminRouter = mergeRouters(
  adminStatsRouter,
  adminUsersRouter,
  adminReviewsRouter,
  adminSettingsRouter,
  adminSecurityRouter,
  adminLegalRouter,
);
