import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react

// For client-side: use the current window origin
// For server-side: use NEXT_PUBLIC_APP_URL or fallback to localhost
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Server-side (for API routes)
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession, getSession, linkSocial } =
  authClient;
