import { PlatformSettings, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export class PlatformSettingsRepository extends BaseRepository<
  PlatformSettings,
  Prisma.PlatformSettingsFindUniqueArgs,
  Prisma.PlatformSettingsFindManyArgs,
  Prisma.PlatformSettingsCreateArgs,
  Prisma.PlatformSettingsUpdateArgs,
  Prisma.PlatformSettingsDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.platformSettings);
  }

  async getSettings(): Promise<PlatformSettings> {
    // Atomic get-or-create: two concurrent first calls can't both insert.
    return this.prismaClient.platformSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", platform_fee: 0 },
    });
  }

  async updatePlatformFee(fee: number): Promise<PlatformSettings> {
    return this.prismaClient.platformSettings.upsert({
      where: { id: "default" },
      update: { platform_fee: fee },
      create: { id: "default", platform_fee: fee },
    });
  }

  async getPlatformFee(): Promise<number> {
    const settings = await this.getSettings();
    return Number(settings.platform_fee);
  }
}
