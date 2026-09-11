import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient | null {
  // During `next build` (or any environment without a configured database),
  // importing this module must NOT throw: route handlers are evaluated while
  // collecting page data. Return null so handlers can degrade gracefully.
  const url = process.env.DATABASE_URL;
  if (!url || url.length === 0) return null;
  try {
    return new PrismaClient({
      log: ["error"],
      datasources: { db: { url } },
    });
  } catch {
    return null;
  }
}

/**
 * Lazily-created Prisma client. `null` when no DATABASE_URL is configured
 * (e.g. static build / preview without backend). Check `hasDatabase()`
 * before touching the database so builds never need a live connection.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = globalForPrisma.prisma ?? createClient();
    if (!client) {
      throw new Error(
        "Database is not configured (DATABASE_URL is missing).",
      );
    }
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Returns true when a database connection string is configured. */
export function hasDatabase(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.length > 0);
}

if (process.env.NODE_ENV !== "production") {
  const client = createClient();
  if (client) globalForPrisma.prisma = client;
}

