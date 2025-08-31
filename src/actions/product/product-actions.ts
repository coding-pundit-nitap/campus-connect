"use server";

import authUtils from "@/lib/utils-functions/auth.utils";
import productRepository from "@/repositories/product.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { productSchema } from "@/validations/product";

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
 * @see {@link productSchema} for input validation rules
 * @see {@link productRepository.createProduct} for the underlying service method
 * @see {@link createSuccessResponse} and {@link createErrorResponse} for response structure
 */
export async function createProductAction(formData: FormData) {
  try {
    const shop_id = await authUtils.getShopId();

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
    const newProduct = await productRepository.createProduct({
      ...parsedData.data,
      image_url: "",
      shop: {
        connect: { id: shop_id },
      },
    });

    // TODO: revalidate

    return createSuccessResponse(newProduct, "Product created successfully");
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    return createErrorResponse("An error occurred while creating the product");
  }
}
