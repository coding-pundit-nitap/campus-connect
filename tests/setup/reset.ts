import type { PrismaClient } from "@/generated/client";

let cachedTables: string[] | null = null;

async function tableNames(prisma: PrismaClient): Promise<string[]> {
  if (cachedTables) return cachedTables;
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  cachedTables = rows.map((r) => `"${r.tablename}"`);
  return cachedTables;
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables = await tableNames(prisma);
  if (tables.length === 0) return;

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`
  );

  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE order_display_id_seq RESTART WITH 1000`
  );
}
