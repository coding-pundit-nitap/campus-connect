import { ConflictError } from "@/lib/custom-error";
import { shopRepository, userRepository } from "@/repositories";
import { ShopActionFormData } from "@/validations";

import { notificationService } from "./notification.service";

class ShopService {
  async createShop(user_id: string, data: ShopActionFormData) {
    const existingShop = await shopRepository.findByOwnerId(user_id);
    if (existingShop) {
      throw new ConflictError("This user already owns a shop.");
    }

    const newShop = await shopRepository.create({
      ...data,
      user: { connect: { id: user_id } },
    });

    const admins = await userRepository.findAdmins({ select: { id: true } });

    await Promise.all(
      admins.map((admin) =>
        notificationService.publishNotification(admin.id, {
          title: "New Shop Created",
          message: `A new shop named "${newShop.name}" has been created and is waiting for approval.`,
          action_url: `/admin/shops`,
          type: "INFO",
        })
      )
    );
    return newShop;
  }
}

export const shopService = new ShopService();
export default shopService;
