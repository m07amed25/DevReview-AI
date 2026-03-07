import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitionProvider } from "@/components/animations/page-transition";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: {
    default: "DevReview AI",
    template: "%s | DevReview AI",
  },
  description:
    "AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.",
  keywords: [
    "code review",
    "AI",
    "GitHub",
    "pull request",
    "security",
    "developer tools",
  ],
  authors: [{ name: "Mohamed Reda" }],
  openGraph: {
    title: "DevReview AI",
    description:
      "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TRPCProvider>
            <PageTransitionProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </PageTransitionProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
