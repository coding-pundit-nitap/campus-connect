import type { PrismaClient } from "@/generated/client";

// Stub for Task 7 verification. Task 8 replaces this with real reference-data
// seeding (roles, categories, etc. that integration tests assume exist).
// Signature intentionally matches the `seedReferenceData(prisma)` call site
// in integration-setup.ts so this compiles under a tsconfig that includes
// tests/ (see note in vitest.config.ts / integration-setup.ts about the
// project's tsconfig.json not currently including tests/**/*.ts).
export async function seedReferenceData(_prisma: PrismaClient) {}
