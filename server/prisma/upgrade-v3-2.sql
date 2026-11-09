-- v3.2: "Week off" for a calendar day + which Saturdays are off per month. Additive only.
ALTER TYPE "public"."WorkDayType" ADD VALUE IF NOT EXISTS 'WEEK_OFF';

CREATE TABLE IF NOT EXISTS "public"."WorkMonthRule" (
    "month" TEXT NOT NULL,
    "saturdaysOff" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkMonthRule_pkey" PRIMARY KEY ("month")
);