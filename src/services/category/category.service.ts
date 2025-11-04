import { categoryRepository } from "@/repositories";

class CategoryServices {
  async cleanupEmptyCategories(shop_id: string): Promise<string[]> {
    try {
      const deletedCategoryIds =
        await categoryRepository.deleteEmptyCategories(shop_id);
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
}

export const categoryServices = new CategoryServices();

export default categoryServices;
