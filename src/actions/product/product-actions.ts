"use server";

import { revalidatePath } from "next/cache";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { serializeProduct } from "@/lib/utils-functions";
import authUtils from "@/lib/utils-functions/auth.utils";
import { categoryRepository, shopRepository } from "@/repositories";
import productRepository from "@/repositories/product.repository";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
import {
  ProductActionFormData,
  productActionSchema,
  productUpdateActionSchema,
  ProductUpdateFormData,
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

    const category = await categoryRepository.findOrCreate(
      parsedData.category,
      shop_id
    );

    const { category: _, ...productData } = parsedData;

    const newProduct = await productRepository.create({
      ...productData,
      shop: {
        connect: { id: shop_id },
      },
      category: {
        connect: { id: category.id },
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

export async function updateProductAction(
  product_id: string,
  formData: Omit<ProductUpdateFormData, "imageKey"> & {
    imageKey: string | null;
  }
): Promise<ActionResponse<SerializedProduct>> {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to update a product");
    }

    const shop_id = context.id;

    const currentProduct = await productRepository.findById(product_id, {
      select: { category_id: true },
    });

    const parsedData = productUpdateActionSchema.parse({
      ...formData,
      imageKey: formData.imageKey || "",
    });

    let category = null;
    if (parsedData.category) {
      category = await categoryRepository.findOrCreate(
        parsedData.category,
        shop_id
      );
    }

    const { category: _, ...productData } = parsedData;

    const updateData: any = {
      data: productData,
    };

    if (category) {
      updateData.data.category = {
        connect: { id: category.id },
      };
    } else {
      updateData.data.category = {
        disconnect: true,
      };
    }

    const updatedProduct = await productRepository.update(
      product_id,
      updateData
    );

    if (
      currentProduct?.category_id &&
      currentProduct.category_id !== category?.id
    ) {
      await categoryRepository.deleteIfEmpty(currentProduct.category_id);
    }

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
      throw new UnauthorizedError("User is not authorized to delete a product");
    }

    const productToDelete = await productRepository.findById(product_id, {
      select: { category_id: true, shop_id: true },
    });

    await productRepository.delete(product_id);

    if (productToDelete?.category_id) {
      await categoryRepository.deleteIfEmpty(productToDelete.category_id);
    }

    return createSuccessResponse(null, "Product deleted successfully");
  } catch (error) {
    console.log("DELETE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to delete product");
  }
}
