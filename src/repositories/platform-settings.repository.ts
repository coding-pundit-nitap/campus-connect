import { PlatformSettings } from "@/generated/client";
import { prisma } from "@/lib/prisma";

class PlatformSettingsRepository {
  async getSettings(): Promise<PlatformSettings> {
    let settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { id: "default", platform_fee: 0 },
      });
    }

    return settings;
  }

  async updatePlatformFee(fee: number): Promise<PlatformSettings> {
    return prisma.platformSettings.upsert({
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

export const platformSettingsRepository = new PlatformSettingsRepository();
export default platformSettingsRepository;
