import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KPIndicator — Know Which Idea Customers Want Before You Build It",
    template: "%s — KPIndicator",
  },
  description:
    "KPIndicator tests your offer with a real landing page, targeted outreach, and measurable buyer behavior—then gives you a clear go, pivot, or no-go recommendation.",
  openGraph: {
    title: "KPIndicator — Know Before You Build",
    description:
      "Done-for-you demand validation using real landing pages, targeted outreach, and buyer behavior before you fund the build.",
    url: siteUrl,
    siteName: "KPIndicator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KPIndicator — Know Before You Build",
    description:
      "Done-for-you market validation. Real traffic, real demand data, a clear go/no-go — before you build.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster position="bottom-right" />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
