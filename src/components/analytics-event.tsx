"use client";

import * as React from "react";
import posthog from "posthog-js";

export function AnalyticsEvent({ event, properties }: { event: string; properties?: Record<string, string | number | boolean> }) {
  React.useEffect(() => {
    if (posthog.__loaded) posthog.capture(event, properties);
  }, [event, properties]);
  return null;
}
