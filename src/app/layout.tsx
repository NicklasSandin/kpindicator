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
    default: "KPIndicator — Test what hits before you build it",
    template: "%s — KPIndicator",
  },
  description:
    "KPIndicator runs real traffic against your 3-5 best ideas, measures what actually converts, and hands you a clear go/no-go — then builds the one that hits.",
  openGraph: {
    title: "KPIndicator — Test what hits before you build it",
    description:
      "Done-for-you market validation. Real landing pages, real traffic, real demand data — before you spend a dollar building.",
    url: siteUrl,
    siteName: "KPIndicator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KPIndicator — Test what hits before you build it",
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
