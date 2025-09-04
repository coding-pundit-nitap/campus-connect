import { ConflictError } from "@/lib/custom-error";
import { shopRepository } from "@/repositories";
import { ShopFormData } from "@/validations";

class ShopService {
  async createShop(user_id: string, data: ShopFormData) {
    const existingShop = await shopRepository.findByOwnerId(user_id);
    if (existingShop) {
      throw new ConflictError("This user already owns a shop.");
    }

    return shopRepository.create({
      ...data,
      owner: { connect: { id: user_id } },
    });
  }
}

export const shopService = new ShopService();
export default shopService;
