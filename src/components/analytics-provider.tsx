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

  React.useEffect(() => {
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      // We call capture("$pageview") manually on route change instead — the
      // App Router doesn't fire the full-page loads autocapture relies on.
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, [key]);

  if (!key) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <React.Suspense fallback={null}>
        <PostHogPageview />
      </React.Suspense>
      {children}
    </PHProvider>
  );
}
