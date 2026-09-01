import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AcceptInvitationButton } from "@/components/auth/accept-invitation-button";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    include: { organization: true },
  });
  if (!invitation) notFound();

  const user = await getSessionUser();
  const unavailable = invitation.acceptedAt || invitation.expiresAt < new Date();
  const signupHref = `/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation.email)}`;
  const loginHref = `/login?invite=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {unavailable ? "Invitation unavailable" : `Join ${invitation.organization.name}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {unavailable
              ? "This invitation has already been used or has expired."
              : `You were invited as ${invitation.role.toLowerCase()} using ${invitation.email}.`}
          </p>
          {!unavailable && user?.email.toLowerCase() === invitation.email && (
            <div className="mt-6"><AcceptInvitationButton token={token} /></div>
          )}
          {!unavailable && user && user.email.toLowerCase() !== invitation.email && (
            <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Log out and sign in as {invitation.email} to accept this invitation.
            </p>
          )}
          {!unavailable && !user && (
            <div className="mt-6 grid gap-3">
              <Button asChild><Link href={signupHref}>Create account and join</Link></Button>
              <Button asChild variant="outline"><Link href={loginHref}>Log in and join</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
