-- v3.1: working-day calendar (company calendar + per-person day exceptions). Additive only.
CREATE TYPE "public"."WorkDayType" AS ENUM ('WORKING', 'HOLIDAY');

CREATE TABLE "public"."WorkCalendarDay" (
    "date" TEXT NOT NULL,
    "type" "public"."WorkDayType" NOT NULL,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkCalendarDay_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "public"."WorkDayOverride" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "working" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkDayOverride_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkDayOverride_date_idx" ON "public"."WorkDayOverride"("date");

CREATE UNIQUE INDEX "WorkDayOverride_employeeId_date_key" ON "public"."WorkDayOverride"("employeeId", "date");

ALTER TABLE "public"."WorkDayOverride" ADD CONSTRAINT "WorkDayOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;