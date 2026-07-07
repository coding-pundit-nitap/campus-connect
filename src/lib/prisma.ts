import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/config/env.config";
import { PrismaClient } from "@/generated/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  adapter: PrismaPg;
};

const adapter =
  globalForPrisma.adapter ||
  new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    adapter,
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}
