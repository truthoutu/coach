-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'GIFT_CARD';

-- CreateEnum
CREATE TYPE "GiftCardStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "GiftCardSubmission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "codeEncrypted" TEXT NOT NULL,
    "codeLast4" TEXT NOT NULL,
    "pinEncrypted" TEXT,
    "claimedValue" DECIMAL(10,2),
    "status" "GiftCardStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCardSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftCardSubmission_status_idx" ON "GiftCardSubmission"("status");

-- AddForeignKey
ALTER TABLE "GiftCardSubmission" ADD CONSTRAINT "GiftCardSubmission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
