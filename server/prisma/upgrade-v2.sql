-- =====================================================================
-- Abacco Lead CRM  v1  ->  v2 upgrade
-- Run ONCE with:  npm run upgrade:v2   (runs inside a single transaction)
-- Keeps: employees, leads, targets, incentives, teams, login security data.
-- Removes: sales CRM fields, sales employees, share links, quotes,
--          email domains, deal updates, notifications, legacy industry.
-- =====================================================================

-- 1) Carry the old lead status (LeadStatus table) over to the new values
ALTER TABLE "public"."Lead" ADD COLUMN "status_v2" TEXT;

UPDATE "public"."Lead" l
SET "status_v2" = CASE
    WHEN lower(s."name") LIKE '%leave%'    THEN 'LEAVE_OUT'
    WHEN lower(s."name") LIKE '%response%' THEN 'NO_RESPONSE'
    WHEN lower(s."name") LIKE '%active%' AND lower(s."name") NOT LIKE '%inactive%' THEN 'ACTIVE'
    ELSE NULL
  END
FROM "public"."LeadStatus" s
WHERE l."statusId" = s."id";

-- 2) Drop foreign keys of removed features
ALTER TABLE "public"."Lead" DROP CONSTRAINT IF EXISTS "Lead_statusId_fkey";
ALTER TABLE "public"."Lead" DROP CONSTRAINT IF EXISTS "Lead_salesEmployeeId_fkey";
ALTER TABLE "public"."SharedLink" DROP CONSTRAINT IF EXISTS "SharedLink_createdById_fkey";
ALTER TABLE "public"."SharedLinkUrl" DROP CONSTRAINT IF EXISTS "SharedLinkUrl_sharedLinkId_fkey";
ALTER TABLE "public"."ReceivedLink" DROP CONSTRAINT IF EXISTS "ReceivedLink_sharedLinkId_fkey";
ALTER TABLE "public"."ReceivedLink" DROP CONSTRAINT IF EXISTS "ReceivedLink_recipientId_fkey";
ALTER TABLE "public"."Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "public"."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
ALTER TABLE "public"."EmailDomain" DROP CONSTRAINT IF EXISTS "EmailDomain_employeeId_fkey";
ALTER TABLE "public"."DealInfo" DROP CONSTRAINT IF EXISTS "DealInfo_industryId_fkey";
ALTER TABLE "public"."DealInfo" DROP CONSTRAINT IF EXISTS "DealInfo_eventId_fkey";
ALTER TABLE "public"."DealInfo" DROP CONSTRAINT IF EXISTS "DealInfo_associationId_fkey";
ALTER TABLE "public"."DealInfo" DROP CONSTRAINT IF EXISTS "DealInfo_employeeId_fkey";
ALTER TABLE "public"."EventMaster" DROP CONSTRAINT IF EXISTS "EventMaster_industryMasterId_fkey";

-- 3) Drop redundant indexes
DROP INDEX IF EXISTS "public"."Employee_employeeId_idx";
DROP INDEX IF EXISTS "public"."EmployeeLeadTarget_employeeId_idx";
DROP INDEX IF EXISTS "public"."Session_token_idx";
DROP INDEX IF EXISTS "public"."LoginHistory_userId_idx";
DROP INDEX IF EXISTS "public"."LoginHistory_employeeId_idx";
DROP INDEX IF EXISTS "public"."LoginHistory_email_idx";
DROP INDEX IF EXISTS "public"."LoginHistory_status_idx";
DROP INDEX IF EXISTS "public"."AllowedIP_ipAddress_idx";
DROP INDEX IF EXISTS "public"."TeamMonthlyReport_employeeId_idx";
DROP INDEX IF EXISTS "public"."TeamDealAnnouncement_employeeId_idx";

-- 4) Remove old lead columns
ALTER TABLE "public"."Lead"
  DROP COLUMN IF EXISTS "forwarded",
  DROP COLUMN IF EXISTS "forwardedAt",
  DROP COLUMN IF EXISTS "forwardedToSales",
  DROP COLUMN IF EXISTS "qualified",
  DROP COLUMN IF EXISTS "salesEmployeeEmail",
  DROP COLUMN IF EXISTS "salesEmployeeId",
  DROP COLUMN IF EXISTS "salesEmployeeName",
  DROP COLUMN IF EXISTS "statusId";

-- 5) Drop removed tables
DROP TABLE IF EXISTS "public"."Quote";
DROP TABLE IF EXISTS "public"."SharedLinkUrl";
DROP TABLE IF EXISTS "public"."ReceivedLink";
DROP TABLE IF EXISTS "public"."SharedLink";
DROP TABLE IF EXISTS "public"."Industry";
DROP TABLE IF EXISTS "public"."Notification";
DROP TABLE IF EXISTS "public"."PushSubscription";
DROP TABLE IF EXISTS "public"."SalesEmployee";
DROP TABLE IF EXISTS "public"."EmailDomain";
DROP TABLE IF EXISTS "public"."LeadStatus";
DROP TABLE IF EXISTS "public"."DealInfo";
DROP TABLE IF EXISTS "public"."EventMaster";
DROP TABLE IF EXISTS "public"."IndustryMaster";
DROP TABLE IF EXISTS "public"."AssociationMaster";
DROP TABLE IF EXISTS "public"."LeadTypeMaster";
DROP TABLE IF EXISTS "public"."DealStatusMaster";

-- 6) New enums + lead status column
CREATE TYPE "public"."LeadStatus" AS ENUM ('PENDING', 'ACTIVE', 'NO_RESPONSE', 'LEAVE_OUT');
CREATE TYPE "public"."RetentionStatus" AS ENUM ('PENDING', 'NOTIFIED', 'DELETED');

ALTER TABLE "public"."Lead"
  ADD COLUMN "status" "public"."LeadStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

UPDATE "public"."Lead"
SET "status" = "status_v2"::"public"."LeadStatus", "statusUpdatedAt" = CURRENT_TIMESTAMP
WHERE "status_v2" IS NOT NULL;

ALTER TABLE "public"."Lead" DROP COLUMN "status_v2";

-- 7) New tables
CREATE TABLE "public"."RetentionRun" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "rangeStart" TIMESTAMP(3) NOT NULL,
    "rangeEnd" TIMESTAMP(3) NOT NULL,
    "leadCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."RetentionStatus" NOT NULL DEFAULT 'PENDING',
    "emailedAt" TIMESTAMP(3),
    "emailError" TEXT,
    "deleteAfter" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RetentionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AppMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppMeta_pkey" PRIMARY KEY ("key")
);

-- 8) Indexes for speed
CREATE INDEX "RetentionRun_status_idx" ON "public"."RetentionRun"("status");
CREATE UNIQUE INDEX "RetentionRun_year_month_key" ON "public"."RetentionRun"("year", "month");
CREATE INDEX IF NOT EXISTS "Lead_employeeId_date_idx" ON "public"."Lead"("employeeId", "date");
CREATE INDEX IF NOT EXISTS "Lead_date_idx" ON "public"."Lead"("date");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "public"."Lead"("createdAt");
CREATE INDEX IF NOT EXISTS "Lead_clientEmail_createdAt_idx" ON "public"."Lead"("clientEmail", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "public"."Lead"("status");
CREATE INDEX IF NOT EXISTS "LoginHistory_sessionId_idx" ON "public"."LoginHistory"("sessionId");
