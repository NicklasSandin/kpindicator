ALTER TABLE "EmailCampaign"
ADD COLUMN "bodyText" TEXT NOT NULL DEFAULT '',
ADD COLUMN "bodyHtml" TEXT,
ADD COLUMN "templateKey" TEXT;

ALTER TYPE "EmailCampaignStatus" ADD VALUE IF NOT EXISTS 'FAILED';

CREATE TABLE "EmailSuppression" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailSuppression_email_key" ON "EmailSuppression"("email");
CREATE INDEX "EmailSuppression_reason_idx" ON "EmailSuppression"("reason");
