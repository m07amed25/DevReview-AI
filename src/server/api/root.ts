import { pullRequestRouter } from "./routers/pull-request";
import { profileRouter } from "./routers/profile";
import { repositoryRouter } from "./routers/repository";
import { settingsRouter } from "./routers/settings";
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
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
