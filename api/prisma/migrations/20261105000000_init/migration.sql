-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('queued', 'reading', 'checking', 'drafting', 'done', 'failed');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('rejection_letter', 'policy', 'bill');

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "status" "CaseStage" NOT NULL,
    "progress_message" TEXT NOT NULL,
    "error_message" TEXT,
    "extracted" JSONB,
    "overrides" JSONB,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_after" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "contents" BYTEA NOT NULL,
    "delete_after" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cases_token_key" ON "cases"("token");

-- CreateIndex
CREATE INDEX "cases_delete_after_idx" ON "cases"("delete_after");

-- CreateIndex
CREATE INDEX "documents_delete_after_idx" ON "documents"("delete_after");

-- CreateIndex
CREATE UNIQUE INDEX "documents_case_id_document_type_key" ON "documents"("case_id", "document_type");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

