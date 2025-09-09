"use server";

import { revalidatePath } from "next/cache";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { serializeProduct } from "@/lib/utils-functions";
import authUtils from "@/lib/utils-functions/auth.utils";
import { shopRepository } from "@/repositories";
import productRepository from "@/repositories/product.repository";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
import {
  ProductActionFormData,
  productActionSchema,
  ProductFormData,
} from "@/validations/product";

export async function createProductAction(
  formData: ProductActionFormData
): Promise<ActionResponse<SerializedProduct>> {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to create a product");
    }

    const shop_id = context.id;

    const parsedData = productActionSchema.parse(formData);
    const newProduct = await productRepository.create({
      ...parsedData,
      shop: {
        connect: { id: shop_id },
      },
    });

    const serializedProduct = serializeProduct(newProduct);

    revalidatePath(`/shop/${shop_id}`);

    return createSuccessResponse(
      serializedProduct,
      "Product created successfully"
    );
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
): Promise<ActionResponse<SerializedProduct>> {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to create a product");
    }
    const parsedData = productActionSchema.parse(formData);

    const updatedProduct = await productRepository.update(product_id, {
      data: parsedData,
    });
    const serializedProduct = serializeProduct(updatedProduct);

    revalidatePath(`/shop/${updatedProduct.shop_id}`);

    return createSuccessResponse(
      serializedProduct,
      "Product updated successfully"
    );
  } catch (error) {
    console.log("UPDATE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to update product");
  }
}

export async function deleteProductAction(
  product_id: string
): Promise<ActionResponse<null>> {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to create a product");
    }

    await productRepository.delete(product_id);
    return createSuccessResponse(null, "Product deleted successfully");
  } catch (error) {
    console.log("DELETE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to delete product");
  }
}
