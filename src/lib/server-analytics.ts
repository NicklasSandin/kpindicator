import { PostHog } from "posthog-node";

export async function captureServerEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || key.endsWith("...")) return;
  const client = new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com" });
  client.capture({ distinctId, event, properties });
  await client.shutdown();
}
