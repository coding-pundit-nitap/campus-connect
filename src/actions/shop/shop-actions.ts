"use server";

import { auth } from "@/auth";
import { shopSchema } from "@/lib/validations/shop";
import shopServices from "@/services/shop.services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

/**
 * Creates a new shop for the authenticated user.
 *
 * This server action validates the provided shop data, authenticates the user,
 * and creates a new shop associated with their account. It ensures that users
 * can only own one shop and validates all input data before creation.
 *
 * @param formData - The form data containing shop information
 * @param formData.name - The shop name (extracted from form)
 * @param formData.description - The shop description (extracted from form)
 * @param formData.location - The physical location of the shop (extracted from form)
 * @param formData.opening - The shop opening time (extracted from form)
 * @param formData.closing - The shop closing time (extracted from form)
 *
 * @returns A promise that resolves to a response object containing:
 *   - success: boolean indicating if the shop was created successfully
 *   - data: the created shop object (if successful)
 *   - message: success or error message with instructions for accessing seller dashboard
 *
 * @throws {Error} When shop creation fails due to service errors
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("name", "Campus Bookstore");
 * formData.append("description", "Books and stationery for students");
 * formData.append("location", "Building A, Room 101");
 * formData.append("opening", "09:00");
 * formData.append("closing", "18:00");
 *
 * const result = await createShopAction(formData);
 *
 * if (result.success) {
 *   console.log("Shop created:", result.data);
 *   // User needs to log out and back in to access seller features
 * } else {
 *   console.error("Creation failed:", result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires user authentication via session
 * - Enforces one shop per user policy
 * - Validates input using shopSchema before creation
 * - User must log out and back in after creation to access seller dashboard
 * - Creates a bidirectional relationship between user and shop
 * - TODO: Add revalidatePath for cache invalidation
 *
 * @see {@link shopSchema} for input validation rules
 * @see {@link shopServices.createShop} for the underlying service method
 * @see {@link shopServices.getShopByOwnerId} for ownership verification
 */
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
      "Shop created successfully! Please log out and back in to access the seller dashboard.",
    );
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);
    return createErrorResponse("Failed to create shop.");
  }
}

/**
 * Updates an existing shop's information for the authenticated shop owner.
 *
 * This server action allows shop owners to modify their shop details including
 * name, description, location, and operating hours. It verifies that the user
 * is authenticated as a seller and has permission to update the shop.
 *
 * @param formData - The form data containing updated shop information
 * @param formData.name - The updated shop name (extracted from form)
 * @param formData.description - The updated shop description (extracted from form)
 * @param formData.location - The updated physical location (extracted from form)
 * @param formData.opening - The updated shop opening time (extracted from form)
 * @param formData.closing - The updated shop closing time (extracted from form)
 *
 * @returns A promise that resolves to a response object containing:
 *   - success: boolean indicating if the shop was updated successfully
 *   - data: success message (if successful)
 *   - message: success or error message
 *
 * @throws {Error} When shop update fails due to service errors
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("name", "Updated Campus Store");
 * formData.append("description", "Extended selection of books and supplies");
 * formData.append("location", "Building B, Room 205");
 * formData.append("opening", "08:30");
 * formData.append("closing", "19:00");
 *
 * const result = await updateShopAction(formData);
 *
 * if (result.success) {
 *   console.log("Shop updated successfully");
 * } else {
 *   console.error("Update failed:", result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires seller authentication (user must have a shop_id)
 * - Only shop owners can update their own shop information
 * - Validates all input data using shopSchema before updating
 * - Updates are applied immediately without requiring re-authentication
 * - TODO: Add revalidatePath for cache invalidation
 *
 * @see {@link shopSchema} for input validation rules
 * @see {@link shopServices.updateShop} for the underlying service method
 */
export async function updateShopAction(formData: FormData) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;

    if (!shop_id) {
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

    await shopServices.updateShop(shop_id, parsedData.data);

    return createSuccessResponse("Shop updated successfully!");
  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    return createErrorResponse("Failed to update shop.");
  }
}
