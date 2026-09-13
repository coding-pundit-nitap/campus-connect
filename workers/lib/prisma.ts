import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/client/index.js";
import { env } from "./env.js";

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
    log: ["info", "warn", "error"],
    adapter,
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}
