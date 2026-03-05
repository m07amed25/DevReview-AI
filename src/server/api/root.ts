import { pullRequestRouter } from "./routers/pull-request";
import { profileRouter } from "./routers/profile";
import { repositoryRouter } from "./routers/repository";
import { reviewRouter } from "./routers/review";
import { settingsRouter } from "./routers/settings";
import { collaborationRouter } from "./routers/collaboration";
import { teamRouter } from "./routers/team";
import { notificationRouter } from "./routers/notification";
import { createCallerFactory, createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date(),
    };
  }),
  profile: profileRouter,
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
  settings: settingsRouter,
  collaboration: collaborationRouter,
  team: teamRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
