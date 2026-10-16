-- Varaq initial schema
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BookCondition" AS ENUM ('MINT', 'GOOD', 'FAIR', 'WORN');

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'LOANED_INTERNAL', 'LOANED_EXTERNAL', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "LoanState" AS ENUM ('REQUESTED', 'APPROVED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "contact_hash" TEXT NOT NULL,
    "avatar_id" INTEGER NOT NULL,
    "karma_tokens" INTEGER NOT NULL DEFAULT 1,
    "trust_score" INTEGER NOT NULL DEFAULT 100,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "listing_bonus_granted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "geohash" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_circles" (
    "user_id" UUID NOT NULL,
    "circle_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_circles_pkey" PRIMARY KEY ("user_id","circle_id")
);

-- CreateTable
CREATE TABLE "book_editions" (
    "id" UUID NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "publisher" TEXT,
    "genres" TEXT[],
    "cover_url" TEXT,
    "search_text" TEXT NOT NULL DEFAULT '',
    "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "search_text")) STORED,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_copies" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "edition_id" UUID NOT NULL,
    "condition" "BookCondition" NOT NULL DEFAULT 'GOOD',
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "owner_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "lender_id" UUID NOT NULL,
    "borrower_id" UUID,
    "external_borrower_name" TEXT,
    "state" "LoanState" NOT NULL DEFAULT 'REQUESTED',
    "handover_pin" TEXT,
    "return_pin" TEXT,
    "pin_attempts" INTEGER NOT NULL DEFAULT 0,
    "token_locked" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TIMESTAMP(3),
    "handover_condition" "BookCondition",
    "return_condition" "BookCondition",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handover_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_passport_entries" (
    "id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "reader_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "city_or_circle" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_passport_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_contact_hash_key" ON "users"("contact_hash");

-- CreateIndex
CREATE UNIQUE INDEX "circles_slug_key" ON "circles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "circles_invite_code_key" ON "circles"("invite_code");

-- CreateIndex
CREATE INDEX "user_circles_circle_id_idx" ON "user_circles"("circle_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_editions_isbn_key" ON "book_editions"("isbn");

-- CreateIndex
CREATE INDEX "book_copies_owner_id_idx" ON "book_copies"("owner_id");

-- CreateIndex
CREATE INDEX "book_copies_edition_id_idx" ON "book_copies"("edition_id");

-- CreateIndex
CREATE INDEX "book_copies_status_idx" ON "book_copies"("status");

-- CreateIndex
CREATE INDEX "loans_copy_id_idx" ON "loans"("copy_id");

-- CreateIndex
CREATE INDEX "loans_lender_id_idx" ON "loans"("lender_id");

-- CreateIndex
CREATE INDEX "loans_borrower_id_idx" ON "loans"("borrower_id");

-- CreateIndex
CREATE INDEX "loans_state_due_date_idx" ON "loans"("state", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "book_passport_entries_loan_id_key" ON "book_passport_entries"("loan_id");

-- CreateIndex
CREATE INDEX "book_passport_entries_copy_id_created_at_idx" ON "book_passport_entries"("copy_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_circles" ADD CONSTRAINT "user_circles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_circles" ADD CONSTRAINT "user_circles_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "book_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_passport_entries" ADD CONSTRAINT "book_passport_entries_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_passport_entries" ADD CONSTRAINT "book_passport_entries_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_passport_entries" ADD CONSTRAINT "book_passport_entries_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Typo-tolerant search over normalized Persian text.
CREATE INDEX "book_editions_search_text_trgm_idx" ON "book_editions" USING GIN ("search_text" gin_trgm_ops);
CREATE INDEX "book_editions_search_vector_idx" ON "book_editions" USING GIN ("search_vector");

-- A copy can have at most one reserved/in-progress loan at a time (many REQUESTED are fine).
CREATE UNIQUE INDEX "loans_one_open_per_copy" ON "loans" ("copy_id") WHERE "state" IN ('APPROVED', 'ACTIVE', 'OVERDUE');

-- Domain invariants.
ALTER TABLE "users" ADD CONSTRAINT "users_karma_tokens_nonneg" CHECK ("karma_tokens" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_range" CHECK ("avatar_id" BETWEEN 1 AND 16);
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_or_external" CHECK ("borrower_id" IS NOT NULL OR "external_borrower_name" IS NOT NULL);
