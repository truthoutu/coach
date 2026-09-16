-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CASHAPP';

-- CreateEnum
CREATE TYPE "SenderRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderRole" "SenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "readByCustomer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_idx" ON "OrderMessage"("orderId");

-- CreateIndex
CREATE INDEX "OrderMessage_createdAt_idx" ON "OrderMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
