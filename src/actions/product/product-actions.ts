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

export async function createProductAction(
  formData: ProductFormData
): Promise<ActionResponse<Product>> {
  try {
    const shop_id = await authUtils.getShopId();

    const parsedData = productSchema.parse(formData);

    // Image upload
    const newProduct = await productRepository.create({
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

    const updatedProduct = await productRepository.update(
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
