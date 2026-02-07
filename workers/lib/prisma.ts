import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  adapter: PrismaPg;
};

const adapter =
  globalForPrisma.adapter ||
  new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["info", "warn", "error"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}
