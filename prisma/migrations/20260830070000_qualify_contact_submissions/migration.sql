ALTER TABLE "ContactSubmission"
ADD COLUMN "currentStage" TEXT,
ADD COLUMN "targetCustomer" TEXT,
ADD COLUMN "priorTests" TEXT,
ADD COLUMN "budget" TEXT,
ADD COLUMN "timeline" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW';

CREATE INDEX "ContactSubmission_status_createdAt_idx"
ON "ContactSubmission"("status", "createdAt");
