-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NumberStatus" AS ENUM ('UNKNOWN', 'SAFE', 'WATCH', 'HIGH_RISK', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LocationConfidence" AS ENUM ('VERIFIED', 'USER_REPORTED', 'APPROXIMATE', 'HISTORICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntelligenceConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('EMERGING', 'ACTIVE', 'DECLINING', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('UPI_FRAUD', 'BANK_FRAUD', 'POLICE_IMPERSONATION', 'KYC_FRAUD', 'LOAN_HARASSMENT', 'JOB_SCAM', 'INVESTMENT_SCAM', 'DELIVERY_SCAM', 'TECH_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneE164" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "status" "NumberStatus" NOT NULL DEFAULT 'UNKNOWN',
    "carrier" TEXT,
    "telecomRegion" TEXT,
    "locationValue" TEXT,
    "locationConfidence" "LocationConfidence" NOT NULL DEFAULT 'UNKNOWN',
    "locationSource" TEXT,
    "intelligenceConfidence" "IntelligenceConfidence" NOT NULL DEFAULT 'LOW',
    "verifiedSignals" INTEGER NOT NULL DEFAULT 0,
    "falsePositiveReports" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "reporterId" TEXT,
    "category" "ReportCategory" NOT NULL,
    "severity" "Severity" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'EMERGING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignNumber" (
    "campaignId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignNumber_pkey" PRIMARY KEY ("campaignId","phoneNumberId")
);

-- CreateTable
CREATE TABLE "BlockedNumber" (
    "e164" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedNumber_pkey" PRIMARY KEY ("e164")
);

-- CreateTable
CREATE TABLE "WhitelistedNumber" (
    "e164" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitelistedNumber_pkey" PRIMARY KEY ("e164")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" "ReportCategory",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_e164_key" ON "PhoneNumber"("e164");

-- CreateIndex
CREATE INDEX "Report_phoneNumberId_createdAt_idx" ON "Report"("phoneNumberId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignNumber" ADD CONSTRAINT "CampaignNumber_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ScamCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignNumber" ADD CONSTRAINT "CampaignNumber_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedNumber" ADD CONSTRAINT "BlockedNumber_phoneNumber_fkey" FOREIGN KEY ("e164") REFERENCES "PhoneNumber"("e164") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhitelistedNumber" ADD CONSTRAINT "WhitelistedNumber_phoneNumber_fkey" FOREIGN KEY ("e164") REFERENCES "PhoneNumber"("e164") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

