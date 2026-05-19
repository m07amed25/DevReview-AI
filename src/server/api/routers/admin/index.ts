import { mergeRouters } from "../../trpc";
import { adminStatsRouter } from "./stats";
import { adminUsersRouter } from "./users";
import { adminReviewsRouter } from "./reviews";
import { adminSettingsRouter } from "./settings";
import { adminSecurityRouter } from "./security";
import { adminLegalRouter } from "./legal";
import { adminMessagesRouter } from "./messages";
import { adminNewsletterRouter } from "./newsletter";

export const adminRouter = mergeRouters(
  adminStatsRouter,
  adminUsersRouter,
  adminReviewsRouter,
  adminSettingsRouter,
  adminSecurityRouter,
  adminLegalRouter,
  adminMessagesRouter,
  adminNewsletterRouter,
);
