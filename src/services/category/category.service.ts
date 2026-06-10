import { categoryRepository } from "@/repositories";

class CategoryServices {
  async cleanupEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      console.error("Error cleaning up empty categories:", error);
      return [];
    }
  }
  async cleanupAllEmptyCategories(): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await categoryRepository.deleteEmptyCategories();
      return deletedCategoryIds;
    } catch (error) {
      console.error("Error cleaning up all empty categories:", error);
      return [];
    }
  }

  async deleteCategoryIfEmpty(category_id: string): Promise<boolean> {
    try {
      return await categoryRepository.deleteIfEmpty(category_id);
    } catch (error) {
      console.error(`Error safely deleting category ${category_id}:`, error);
      return false;
    }
  }

  async getActiveCategories() {
    try {
      return await categoryRepository.getActiveCategories();
    } catch (error) {
      console.error("Error fetching active categories in service:", error);
      return [];
    }
  }
}

export const categoryServices = new CategoryServices();

export default categoryServices;
