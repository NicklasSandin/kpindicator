import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { JsonLd } from "@/components/json-ld";
import { SITE, organizationSchema, websiteSchema } from "@/lib/seo";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// Display face for headlines only. One weight, by design — an editorial
// serif at 400 does the work that a template hero fakes with font-semibold.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Variable grotesque for UI and body copy.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Anything measured — metrics, eyebrows, labels — sets in mono.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Relative canonical resolves per-route against metadataBase, so every page
  // gets a correct self-referencing canonical without touching 14 files.
  alternates: { canonical: "./" },
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: siteUrl }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "business",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
      className={`${archivo.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <JsonLd schema={[organizationSchema(), websiteSchema()]} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
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
