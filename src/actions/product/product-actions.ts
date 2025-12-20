"use server";

import { revalidatePath } from "next/cache";

import { Category } from "@/../prisma/generated/client";
import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { serializeProduct } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  cartRepository,
  categoryRepository,
  shopRepository,
} from "@/repositories";
import productRepository from "@/repositories/product.repository";
import { fileUploadService } from "@/services/file-upload/file-upload.service";
import { notificationService } from "@/services/notification/notification.service";
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
  let uploadedImageKey: string | null = null;

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

    const { image, name, price, stock_quantity, description, discount } =
      parsedData;
    let image_key = "";
    if (image) {
      const imageFile = image as File;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      image_key = await fileUploadService.upload(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer
      );
      uploadedImageKey = image_key;
    }
    const productData = {
      image_key,
      name,
      price,
      stock_quantity,
      description,
      discount,
    };

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
    if (uploadedImageKey) {
      try {
        await fileUploadService.deleteFile(uploadedImageKey);
      } catch (cleanupError) {
        console.error(
          `Failed to cleanup file ${uploadedImageKey} after product creation failure:`,
          cleanupError
        );
      }
    }

    console.error("CREATE PRODUCT ERROR:", error);
    throw new InternalServerError("Failed to create product.");
  }
}

export async function updateProductAction(
  product_id: string,
  formData: Omit<ProductUpdateFormData, "image_key"> & {
    image_key: string | null;
  }
): Promise<ActionResponse<SerializedProduct>> {
  try {
    const { shop_id } = await authUtils.getUserData();
    if (!shop_id) {
      throw new UnauthorizedError("User is not authorized to update a product");
    }

    const currentProduct = await productRepository.findById(product_id, {
      select: { category_id: true, image_key: true },
    });

    const parsedData = productUpdateActionSchema.parse({
      ...formData,
      image_key: formData.image_key || "",
    });

    let category: Category | null = null;
    if (parsedData.category) {
      category = await categoryRepository.findOrCreate(
        parsedData.category,
        shop_id
      );
    }

    const { image_key, name, price, stock_quantity, description, discount } =
      parsedData;

    if (currentProduct?.image_key && currentProduct.image_key !== image_key) {
      await fileUploadService.deleteFile(currentProduct.image_key);
    }

    const productData = {
      image_key,
      name,
      price,
      stock_quantity,
      description,
      discount,
    };

    const updateData: {
      data: typeof productData & {
        category?: { connect: { id: string } } | { disconnect: true };
      };
    } = {
      data: {
        ...productData,
      },
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
      select: { category_id: true, shop_id: true, name: true },
    });

    if (!productToDelete) {
      throw new InternalServerError("Product not found");
    }

    // Get users who have this product in their cart (via repository)
    const uniqueUserIds =
      await cartRepository.getUserIdsByProductInCart(product_id);

    await Promise.allSettled(
      uniqueUserIds.map((userId) =>
        notificationService
          .publishNotification(userId, {
            title: "Item Removed from Cart",
            message: `${productToDelete.name} has been removed from your cart as it is no longer available.`,
            type: "WARNING",
          })
          .catch((err) =>
            console.error(`Failed to notify user ${userId}:`, err)
          )
      )
    );

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
