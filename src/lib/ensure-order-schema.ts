import { prisma } from "@/lib/prisma";

let ready: Promise<void> | null = null;

export function ensureOrderSchema() {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASHAPP'`);
      await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'APPLE_PAY'`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentImage" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentNote" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPaidAt" TIMESTAMP(3)`);
    })().catch((err) => {
      ready = null;
      console.error("ensureOrderSchema", err);
    });
  }
  return ready;
}
