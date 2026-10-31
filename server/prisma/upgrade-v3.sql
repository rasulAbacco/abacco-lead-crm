-- Abacco Lead CRM v2 -> v3 (attendance, biometric, clock-in, notifications)
-- Only adds new tables/columns; no data is removed.
-- CreateEnum
CREATE TYPE "public"."SaturdayRule" AS ENUM ('WORKING', 'OFF', 'ALTERNATE');

-- AlterTable
ALTER TABLE "public"."Employee" ADD COLUMN     "saturdayRule" "public"."SaturdayRule" NOT NULL DEFAULT 'ALTERNATE';

-- CreateTable
CREATE TABLE "public"."WorkSession" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "autoClosed" BOOLEAN NOT NULL DEFAULT false,
    "clockInIp" TEXT,
    "clockOutIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BiometricDevice" (
    "id" SERIAL NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "deviceName" TEXT,
    "location" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiometricDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BiometricMapping" (
    "id" SERIAL NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "BiometricMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BiometricPunch" (
    "id" SERIAL NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "deviceId" INTEGER,
    "mappingId" INTEGER,
    "employeeId" TEXT,
    "location" TEXT,
    "punchTime" TIMESTAMP(3) NOT NULL,
    "punchMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiometricPunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "refKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSession_employeeId_workDate_idx" ON "public"."WorkSession"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "WorkSession_clockOut_idx" ON "public"."WorkSession"("clockOut");

-- CreateIndex
CREATE INDEX "WorkSession_workDate_idx" ON "public"."WorkSession"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricDevice_deviceCode_location_key" ON "public"."BiometricDevice"("deviceCode", "location");

-- CreateIndex
CREATE INDEX "BiometricMapping_enrollmentId_location_isActive_idx" ON "public"."BiometricMapping"("enrollmentId", "location", "isActive");

-- CreateIndex
CREATE INDEX "BiometricMapping_employeeId_idx" ON "public"."BiometricMapping"("employeeId");

-- CreateIndex
CREATE INDEX "BiometricPunch_employeeId_punchTime_idx" ON "public"."BiometricPunch"("employeeId", "punchTime");

-- CreateIndex
CREATE INDEX "BiometricPunch_punchTime_idx" ON "public"."BiometricPunch"("punchTime");

-- CreateIndex
CREATE INDEX "BiometricPunch_enrollmentId_punchTime_idx" ON "public"."BiometricPunch"("enrollmentId", "punchTime");

-- CreateIndex
CREATE INDEX "Notification_employeeId_readAt_idx" ON "public"."Notification"("employeeId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_employeeId_refKey_idx" ON "public"."Notification"("employeeId", "refKey");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."WorkSession" ADD CONSTRAINT "WorkSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BiometricMapping" ADD CONSTRAINT "BiometricMapping_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BiometricPunch" ADD CONSTRAINT "BiometricPunch_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."BiometricDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BiometricPunch" ADD CONSTRAINT "BiometricPunch_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "public"."BiometricMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BiometricPunch" ADD CONSTRAINT "BiometricPunch_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

