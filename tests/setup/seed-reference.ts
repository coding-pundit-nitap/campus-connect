import type { PrismaClient } from "@/generated/client";

export async function seedReferenceData(prisma: PrismaClient): Promise<void> {
  await prisma.platformSettings.create({
    data: { platform_fee: 5 },
  });
  await prisma.building.create({
    data: { id: "bld-test-1", name: "Test Hostel" },
  });
  await prisma.category.create({
    data: { id: "cat-test-1", name: "Test Category" },
  });
}
