import { Category } from "@/generated/client";
import { CategoryRepository } from "@/repositories/category.repository";

export class CategoryServices {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async cleanupEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await this.categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      console.error("Error cleaning up empty categories:", error);
      return [];
    }
  }
  async cleanupAllEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await this.categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      console.error("Error cleaning up all empty categories:", error);
      return [];
    }
  }

  async deleteCategoryIfEmpty(category_id: string): Promise<boolean> {
    try {
      return await this.categoryRepository.deleteIfEmpty(category_id);
    } catch (error) {
      console.error(`Error safely deleting category ${category_id}:`, error);
      return false;
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    try {
      return await this.categoryRepository.getActiveCategories();
    } catch (error) {
      console.error("Error fetching active categories in service:", error);
      return [];
    }
  }
}
