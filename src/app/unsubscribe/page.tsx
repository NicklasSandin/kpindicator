import type { Metadata } from "next";

import { UnsubscribeForm } from "@/components/marketing/unsubscribe-form";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Email preferences</h1>
      <UnsubscribeForm token={token} />
    </main>
  );
}
