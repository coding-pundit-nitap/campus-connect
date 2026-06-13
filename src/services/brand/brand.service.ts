import { Brand } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { BrandRepository } from "@/repositories/brand.repository";
const log = createLogger("brand.service");

export class BrandServices {
  constructor(private readonly brandRepository: BrandRepository) {}

  async cleanupEmptyBrands(): Promise<string[]> {
    try {
      const deletedBrandIds = await this.brandRepository.deleteEmptyBrands();
      return deletedBrandIds;
    } catch (error) {
      log.error({ err: error }, "Error cleaning up empty brands:");
      return [];
    }
  }
  async cleanupAllEmptyBrands(): Promise<string[]> {
    try {
      const deletedBrandIds = await this.brandRepository.deleteEmptyBrands();
      return deletedBrandIds;
    } catch (error) {
      log.error({ err: error }, "Error cleaning up all empty brands:");
      return [];
    }
  }

  async deleteBrandIfEmpty(brand_id: string): Promise<boolean> {
    try {
      return await this.brandRepository.deleteIfEmpty(brand_id);
    } catch (error) {
      log.error({ err: error }, `Error safely deleting brand ${brand_id}:`);
      return false;
    }
  }

  async getActiveBrands(): Promise<Brand[]> {
    try {
      return await this.brandRepository.getActiveBrands();
    } catch (error) {
      log.error({ err: error }, "Error fetching active brands in service:");
      return [];
    }
  }
}
