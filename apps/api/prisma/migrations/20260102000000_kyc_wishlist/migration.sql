-- Private KYC identity (nullable so pre-existing rows stay valid; the API requires them for new users).
ALTER TABLE "users" ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT,
ADD COLUMN "national_id" TEXT,
ADD COLUMN "phone_number" TEXT,
ADD COLUMN "birth_date" TEXT;

CREATE UNIQUE INDEX "users_national_id_key" ON "users"("national_id");
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- Wishlist / bookmarks (per edition).
CREATE TABLE "wishlist_items" (
    "user_id" UUID NOT NULL,
    "edition_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("user_id","edition_id")
);
CREATE INDEX "wishlist_items_edition_id_idx" ON "wishlist_items"("edition_id");
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "book_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
