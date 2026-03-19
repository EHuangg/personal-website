-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'AUTO_REJECTED', 'MANUALLY_REJECTED', 'QUEUED', 'BUILT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "autoRejectionReason" TEXT,
    "manualRejectionReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "generatedPatch" JSONB NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "builtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSnapshot" (
    "id" TEXT NOT NULL,
    "buildId" TEXT,
    "htmlContent" TEXT NOT NULL,
    "authorDisplayName" TEXT,
    "authorFingerprint" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fingerprint" (
    "id" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_fingerprintHash_idx" ON "Submission"("fingerprintHash");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Build_submissionId_key" ON "Build"("submissionId");

-- CreateIndex
CREATE INDEX "SiteSnapshot_isCurrent_idx" ON "SiteSnapshot"("isCurrent");

-- CreateIndex
CREATE INDEX "SiteSnapshot_createdAt_idx" ON "SiteSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "Fingerprint_fingerprintHash_idx" ON "Fingerprint"("fingerprintHash");

-- CreateIndex
CREATE INDEX "Fingerprint_createdAt_idx" ON "Fingerprint"("createdAt");

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSnapshot" ADD CONSTRAINT "SiteSnapshot_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fingerprint" ADD CONSTRAINT "Fingerprint_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
