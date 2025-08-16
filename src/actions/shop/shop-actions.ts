import { auth } from "@/auth";
import { shopSchema } from "@/lib/validations/shop";
import shopServices from "@/services/shop.services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

export async function createShopAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return createErrorResponse("Unauthorize: Please log in");
    }
    const existingShop = await shopServices.getShopByOwnerId(session.user.id);
    if (existingShop) {
      return createErrorResponse("You already own a shop");
    }
    const parsedData = shopSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      opening: formData.get("opening"),
      closing: formData.get("closing"),
    });
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    const newShop = await shopServices.createShop({
      ...parsedData.data,
      owner: { connect: { id: session.user.id } },
    });

    // TODO: revalidate

    return createSuccessResponse(
      newShop,
      "Shop created successfully! Please log out and back in to access the seller dashboard."
    );
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);
    return createErrorResponse("Failed to create shop.");
  }
}


export async function updateShopAction(formData: FormData) {
  try {
    const session = await auth();
    const shopId = session?.user?.shop_id;

    if (!shopId) {
      return createErrorResponse("Unauthorized: You are not a seller.");
    }

    const parsedData = shopSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      opening: formData.get("opening"),
      closing: formData.get("closing"),
    });

    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    await shopServices.updateShop(shopId, parsedData.data);

    return createSuccessResponse("Shop updated successfully!");

  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    return createErrorResponse("Failed to update shop.");
  }
}
