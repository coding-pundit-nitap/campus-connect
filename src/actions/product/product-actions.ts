"use server";

import { Product } from "@prisma/client";

import authUtils from "@/lib/utils-functions/auth.utils";
import productRepository from "@/repositories/product.repository";
import {
  ActionResponse,
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { ProductFormData, productSchema } from "@/validations/product";

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
 */
export async function createProductAction(
  formData: ProductFormData
): Promise<ActionResponse<Product>> {
  try {
    const shop_id = await authUtils.getShopId();

    const parsedData = productSchema.parse(formData);

    // Image upload
    const newProduct = await productRepository.createProduct({
      ...parsedData,
      image_url: "",
      shop: {
        connect: { id: shop_id },
      },
    });

    // TODO: revalidate

    return createSuccessResponse(newProduct, "Product created successfully");
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    throw error;
  }
}

interface UpdateProductActionFormData
  extends Omit<ProductFormData, "image_url"> {
  image_url: string | null;
}

export async function updateProductAction(
  product_id: string,
  formData: UpdateProductActionFormData
) {
  try {
    const parsedData = productSchema.safeParse(formData);
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    const updateData = {
      ...parsedData.data,
      image_url:
        typeof parsedData.data.image_url === "string"
          ? parsedData.data.image_url
          : undefined,
    };

    const updatedProduct = await productRepository.updateProduct(
      product_id,
      updateData
    );

    // TODO: revalidate

    return createSuccessResponse(
      updatedProduct,
      "Product updated successfully"
    );
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return createErrorResponse("An error occurred while updating the product");
  }
}
