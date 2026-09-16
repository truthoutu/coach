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
    // NOTE: Prisma v6 removed the `datasources` constructor override — the
    // connection string comes from DATABASE_URL in the environment.
    void url;
    return new PrismaClient({
      log: ["error"],
    });
  } catch {
    return null;
  }
}

/**
 * Prisma client singleton, cached on `globalThis` so hot-reload in dev and
 * warm serverless containers reuse one client (a fresh pool per request
 * exhausts the Neon connection limit and 500s every route).
 *
 * Importing this module never throws, even without DATABASE_URL - route
 * handlers check `hasDatabase()` first and return a friendly 503 instead.
 */
export const prisma: PrismaClient = ((): PrismaClient => {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;
  const client = createClient() ?? new PrismaClient({ log: ["error"] });
  globalForPrisma.prisma = client;
  return client;
})();

/** Returns true when a database connection string is configured. */
export function hasDatabase(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.length > 0);
}
