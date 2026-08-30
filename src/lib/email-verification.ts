import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashVerificationToken(token), expiresAt },
    }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verificationUrl = `${siteUrl}/verify-email/${token}`;
  const delivered = await sendEmail(
    user.email,
    "Verify your KPIndicator email",
    `Hi ${user.name},\n\nVerify your email address to finish setting up your KPIndicator account:\n\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
  );

  return { delivered, verificationUrl, expiresAt };
}
