"use server";

import { Product } from "@prisma/client";

import { InternalServerError } from "@/lib/custom-error";
import { serializeProduct } from "@/lib/utils-functions";
import authUtils from "@/lib/utils-functions/auth.utils";
import productRepository from "@/repositories/product.repository";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
import { ProductFormData, productSchema } from "@/validations/product";

export async function createProductAction(
  formData: ProductFormData
): Promise<ActionResponse<Product>> {
  try {
    const shop_id = await authUtils.getShopId();

    const parsedData = productSchema.parse(formData);
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
    const parsedData = productSchema.parse(formData);

    const updateData = {
      ...parsedData,
      image_url:
        typeof parsedData.image_url === "string"
          ? parsedData.image_url
          : undefined,
    };

    const updatedProduct = await productRepository.update(product_id, {
      data: updateData,
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
