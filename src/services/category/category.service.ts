import { Category } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { CategoryRepository } from "@/repositories/category.repository";
const log = createLogger("category.service");

export class CategoryServices {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async cleanupEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await this.categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      log.error({ err: error }, "Error cleaning up empty categories:");
      return [];
    }
  }
  async cleanupAllEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await this.categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      log.error({ err: error }, "Error cleaning up all empty categories:");
      return [];
    }
  }

  async deleteCategoryIfEmpty(category_id: string): Promise<boolean> {
    try {
      return await this.categoryRepository.deleteIfEmpty(category_id);
    } catch (error) {
      log.error(
        { err: error },
        `Error safely deleting category ${category_id}:`
      );
      return false;
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    try {
      return await this.categoryRepository.getActiveCategories();
    } catch (error) {
      log.error({ err: error }, "Error fetching active categories in service:");
      return [];
    }
  }
}
