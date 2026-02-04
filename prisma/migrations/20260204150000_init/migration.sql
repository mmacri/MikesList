-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "moderationStatus" TEXT NOT NULL DEFAULT 'approved',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "locationLabel" TEXT NOT NULL,
    "locationSlug" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "priceAmount" INTEGER,
    "priceUnit" TEXT,
    "description" TEXT NOT NULL,
    "posterEmail" TEXT NOT NULL,
    "manageTokenHash" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" DATETIME,
    "lastBumpedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRenewedAt" DATETIME,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderStage" TEXT,
    "lastReminderSentAt" DATETIME,
    CONSTRAINT "Listing_status_check" CHECK ("status" IN ('active', 'expired', 'removed')),
    CONSTRAINT "Listing_moderationStatus_check" CHECK ("moderationStatus" IN ('approved', 'pending', 'rejected')),
    CONSTRAINT "Listing_locationType_check" CHECK ("locationType" IN ('city', 'remote')),
    CONSTRAINT "Listing_lastReminderStage_check" CHECK ("lastReminderStage" IN ('seven_day', 'one_day'))
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ipHash" TEXT,
    CONSTRAINT "Report_status_check" CHECK ("status" IN ('open', 'reviewed', 'dismissed')),
    CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "windowStart" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_manageTokenHash_key" ON "Listing"("manageTokenHash");

-- CreateIndex
CREATE INDEX "Listing_status_moderationStatus_expiresAt_idx" ON "Listing"("status", "moderationStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "Listing_categorySlug_idx" ON "Listing"("categorySlug");

-- CreateIndex
CREATE INDEX "Listing_locationSlug_idx" ON "Listing"("locationSlug");

-- CreateIndex
CREATE INDEX "Listing_isFeatured_featuredUntil_idx" ON "Listing"("isFeatured", "featuredUntil");

-- CreateIndex
CREATE INDEX "Listing_lastBumpedAt_idx" ON "Listing"("lastBumpedAt");

-- CreateIndex
CREATE INDEX "Listing_updatedAt_idx" ON "Listing"("updatedAt");

-- CreateIndex
CREATE INDEX "Report_listingId_idx" ON "Report"("listingId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");
