import { createAuthClient } from "better-auth/react";
import { ssoClient } from "@better-auth/sso/client";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [ssoClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, linkSocial } =
  authClient;
