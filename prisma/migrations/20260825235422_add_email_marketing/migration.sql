-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "audience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "firstOpenedAt" DATETIME,
    "lastOpenedAt" DATETIME,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "firstClickedAt" DATETIME,
    "lastClickedAt" DATETIME,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedAt" DATETIME,
    "bounceReason" TEXT,
    "unsubscribedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "url" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "EmailRecipient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EmailRecipient_campaignId_idx" ON "EmailRecipient"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRecipient_campaignId_email_key" ON "EmailRecipient"("campaignId", "email");

-- CreateIndex
CREATE INDEX "EmailEvent_recipientId_idx" ON "EmailEvent"("recipientId");
