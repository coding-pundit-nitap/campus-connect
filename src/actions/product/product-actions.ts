"use server";

import { Product } from "@prisma/client";

import { InternalServerError } from "@/lib/custom-error";
import { serializeProduct } from "@/lib/utils-functions";
import authUtils from "@/lib/utils-functions/auth.utils";
import productRepository from "@/repositories/product.repository";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
import {
  ProductActionFormData,
  productActionSchema,
  ProductFormData,
} from "@/validations/product";

export async function createProductAction(
  formData: ProductActionFormData
): Promise<ActionResponse<Product>> {
  try {
    const shop_id = await authUtils.getShopId();

    const parsedData = productActionSchema.parse(formData);
    const newProduct = await productRepository.create({
      ...parsedData,
      shop: {
        connect: { id: shop_id },
      },
    });

    // TODO: revalidate

    return createSuccessResponse(newProduct, "Product created successfully");
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to create product.");
  }
}

interface UpdateProductActionFormData
  extends Omit<ProductFormData, "imageKey"> {
  imageKey: string | null;
}

export async function updateProductAction(
  product_id: string,
  formData: UpdateProductActionFormData
) {
  try {
    const parsedData = productActionSchema.parse(formData);

    const updatedProduct = await productRepository.update(product_id, {
      data: parsedData,
    });
    const serializedProduct = serializeProduct(updatedProduct);

    // TODO: revalidate

    return createSuccessResponse(
      serializedProduct,
      "Product updated successfully"
    );
  } catch (error) {
    console.log("UPDATE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to update product");
  }
}

export async function deleteProductAction(product_id: string) {
  try {
    await productRepository.delete(product_id);
    return createSuccessResponse(null, "Product deleted successfully");
  } catch (error) {
    console.log("DELETE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to delete product");
  }
}
