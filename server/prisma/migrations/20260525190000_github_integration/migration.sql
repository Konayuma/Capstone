-- GitHub repository integration fields
ALTER TABLE "Project"
ADD COLUMN "githubRepositoryUrl" TEXT,
ADD COLUMN "githubRepositoryOwner" TEXT,
ADD COLUMN "githubRepositoryName" TEXT,
ADD COLUMN "githubInstallationId" INTEGER,
ADD COLUMN "githubDefaultBranch" TEXT,
ADD COLUMN "githubDocsPath" TEXT,
ADD COLUMN "githubRequirementsPath" TEXT,
ADD COLUMN "githubNotesPath" TEXT,
ADD COLUMN "githubSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "githubConnectedAt" TIMESTAMP(3),
ADD COLUMN "githubLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "githubLastSyncStatus" TEXT,
ADD COLUMN "githubLastSyncSummary" TEXT,
ADD COLUMN "githubLastSyncError" TEXT;
