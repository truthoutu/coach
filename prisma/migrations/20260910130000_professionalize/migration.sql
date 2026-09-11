-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BITCOIN', 'ZELLE', 'CHIME');

-- AlterTable (step 1: add new columns while legacy data is still present)
ALTER TABLE "Product"
    ADD COLUMN     "collection" TEXT,
    ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
    ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'Unisex',
    ADD COLUMN     "images" TEXT[],
    ADD COLUMN     "inventory" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN     "sku" TEXT,
    ADD COLUMN     "slug" TEXT,
    ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN     "subcategory" TEXT,
    ALTER COLUMN "category" SET DEFAULT 'Bags';

-- Normalize legacy categories into the canonical set
UPDATE "Product" SET "category" = 'Bags' WHERE "category" IN ('Handbags', 'Handbag');

-- Convert price strings ("$575", "$1,295.00") to DECIMAL(10,2)
ALTER TABLE "Product"
    ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2)
    USING (NULLIF(regexp_replace("price", '[^0-9.]', '', 'g'), '')::DECIMAL(10,2));

-- Move the legacy single-image URL into the images array
UPDATE "Product"
    SET "images" = CASE
        WHEN "image" IS NULL OR "image" = '' THEN ARRAY[]::TEXT[]
        ELSE ARRAY["image"]::TEXT[]
    END
    WHERE "images" IS NULL;

-- Drop legacy image column (now represented by images)
ALTER TABLE "Product" DROP COLUMN "image";

-- Backfill URL-safe slugs from product names
UPDATE "Product" SET "slug" = COALESCE(
    NULLIF(regexp_replace(lower(trim("name")), '[^a-z0-9]+', '-', 'g'), ''),
    'product-' || lower("id")
) WHERE "slug" IS NULL;

-- De-duplicate slugs (append a counter to any collisions)
UPDATE "Product" p
SET "slug" = p."slug" || '-' || d.rn
FROM (
    SELECT "id", row_number() OVER (PARTITION BY "slug" ORDER BY "createdAt") AS rn
    FROM "Product"
) d
WHERE p."id" = d."id" AND d.rn > 1;

-- Enforce NOT NULL + uniqueness now that slugs are backfilled
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "itemsTotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER NOT NULL,
    "image" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;