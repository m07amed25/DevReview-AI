import { pullRequestRouter } from "./routers/pull-request";
import { profileRouter } from "./routers/profile";
import { repositoryRouter } from "./routers/repository";
import { reviewRouter } from "./routers/review";
import { settingsRouter } from "./routers/settings";
import { collaborationRouter } from "./routers/collaboration";
import { teamRouter } from "./routers/team";
import { notificationRouter } from "./routers/notification";
import { analyticsRouter } from "./routers/analytics";
import { automationRouter } from "./routers/automation";
import { diagramRouter } from "./routers/diagram";
import { adminRouter } from "./routers/admin";
import { adminPricingRouter } from "./routers/admin-pricing";
import { rulesRouter } from "./routers/rules";
import { securityRouter } from "./routers/security";
import { homeRouter } from "./routers/home";
import { billingRouter } from "./routers/billing";
import { paymentRouter } from "./routers/payment";
import { createCallerFactory, createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date(),
    };
  }),
  home: homeRouter,
  profile: profileRouter,
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  settings: settingsRouter,
  collaboration: collaborationRouter,
  team: teamRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  automation: automationRouter,
  diagram: diagramRouter,
  admin: adminRouter,
  adminPricing: adminPricingRouter,
  rules: rulesRouter,
  security: securityRouter,
  billing: billingRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
