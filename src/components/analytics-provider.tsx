"use client";

import * as React from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  React.useEffect(() => {
    if (!pathname || !posthogClient) return;
    const search = searchParams.toString();
    posthogClient.capture("$pageview", {
      $current_url: search ? `${pathname}?${search}` : pathname,
    });
  }, [pathname, searchParams, posthogClient]);

  return null;
}

const PLACEHOLDER_KEY = /\.\.\.$/;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const rawKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const key = rawKey && !PLACEHOLDER_KEY.test(rawKey) ? rawKey : undefined;

  /**
   * Gates the pageview tracker until init has actually happened.
   *
   * React runs child effects before parent ones, so PostHogPageview fired its
   * first capture() against an uninitialised PostHog — a silent no-op. With
   * capture_pageview off, nothing else fired either, so anyone who read one
   * page and left was never recorded. That is most visitors, which made the
   * whole setup look configured while collecting nothing.
   */
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!key) return;

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        defaults: "2026-05-30",
        // We call capture("$pageview") manually on route change instead — the
        // App Router doesn't fire the full-page loads autocapture relies on.
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
    }

    setReady(true);
  }, [key]);

  if (!key) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <React.Suspense fallback={null}>{ready ? <PostHogPageview /> : null}</React.Suspense>
      {children}
    </PHProvider>
  );
}
