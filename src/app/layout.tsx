import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "lenis/dist/lenis.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitionProvider } from "@/components/animations/page-transition";
import { ErrorBoundary } from "@/components/error-boundary";
import { LenisProvider } from "@/components/lenis-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
    "automated code review",
    "AI code review",
    "SaaS",
    "continuous integration",
  ],
  authors: [{ name: "Mohamed Reda" }],
  creator: "Mohamed Reda",
  publisher: "DevReview AI",
  applicationName: "DevReview AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevReview AI",
  },
  openGraph: {
    title: "DevReview AI | Smart Automated Code Reviews",
    description:
      "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly directly in your GitHub pull requests.",
    type: "website",
    siteName: "DevReview AI",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevReview AI | Smart Automated Code Reviews",
    description:
      "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-token", // User will need to replace this
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
          <LenisProvider>
            <TRPCProvider>
              <PageTransitionProvider>
                <ErrorBoundary>{children}</ErrorBoundary>
              </PageTransitionProvider>
            </TRPCProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
