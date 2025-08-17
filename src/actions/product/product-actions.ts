"use server";

import { auth } from "@/auth";
import { productSchema } from "@/lib/validations/product";
import productServices from "@/services/product.services";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";

/**
 * Creates a new product for the authenticated shop owner.
 *
 * This server action validates the provided product data, authenticates the user as a shop owner,
 * and creates a new product associated with their shop. The function expects form data containing
 * product details and returns an appropriate response based on the creation result.
 *
 * @param formData - The form data containing product information
 * @param formData.name - The product name (extracted from form)
 * @param formData.description - The product description (extracted from form)
 * @param formData.price - The product price (extracted from form)
 * @param formData.stock_quantity - The initial stock quantity (extracted from form)
 *
 * @returns A promise that resolves to a response object containing:
 *   - success: boolean indicating if the product was created successfully
 *   - data: the created product object (if successful)
 *   - message: success or error message
 *
 * @throws {Error} When product creation fails due to service errors
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("name", "Laptop");
 * formData.append("description", "High-performance laptop");
 * formData.append("price", "999.99");
 * formData.append("stock_quantity", "10");
 *
 * const result = await createProductAction(formData);
 *
 * if (result.success) {
 *   console.log("Product created:", result.data);
 * } else {
 *   console.error("Creation failed:", result.message);
 * }
 * ```
 *
 * @remarks
 * - Requires user authentication and shop ownership
 * - Validates input using productSchema before creation
 * - Currently sets image_url to empty string (image upload not implemented)
 * - Associates the product with the authenticated user's shop
 * - TODO: Implement actual image upload functionality
 * - TODO: Add revalidatePath for cache invalidation
 *
 * @see {@link productSchema} for input validation rules
 * @see {@link productServices.createProduct} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response structure
 */
export async function createProductAction(formData: FormData) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;
    if (!shop_id) {
      return createErrorResponse("User is not associated with a shop");
    }

    const parsedData = productSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      stock_quantity: formData.get("stock_quantity"),
    });
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    // Image upload
    const newProduct = await productServices.createProduct({
      ...parsedData.data,
      image_url: "",
      shop: {
        connect: { id: shop_id },
      },
    });

    // TODO: revalidate

    return createSuccessResponse(newProduct, "Product created successfully");
  } catch (error) {
    return createErrorResponse("An error occurred while creating the product");
  }
}
