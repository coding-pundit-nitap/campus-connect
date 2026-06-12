"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { notifyStockWatchers } from "@/actions/products/stock-watch-actions";
import { Category } from "@/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
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
  ProductUpdateActionFormData,
  productUpdateActionSchema,
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

    const category = await categoryRepository.findOrCreate(parsedData.category);

    const { image, name, price, stock_quantity, description, discount } =
      parsedData;
    let image_key = "";
    if (image) {
      const imageFile = image as File;
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const uploadResult = await fileUploadService.uploadOptimizedImage(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer,
        { prefix: "product-images" }
      );

      image_key = uploadResult.key;
      uploadedImageKey = image_key;

      console.log(
        `Product image optimized: ${uploadResult.compressionRatio}% reduction`
      );
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
      data: {
        ...productData,
        shop: {
          connect: { id: shop_id },
        },
        category: {
          connect: { id: category.id },
        },
      },
      include: {
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const serializedProduct = serializeProduct(newProduct);

    revalidatePath(`/shops/${shop_id}`);

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
  formData: ProductUpdateActionFormData
): Promise<ActionResponse<SerializedProduct>> {
  try {
    const { shop_id } = await authUtils.getUserData();
    if (!shop_id) {
      throw new UnauthorizedError("User is not authorized to update a product");
    }

    const currentProduct = await productRepository.findById(product_id, {
      select: { category_id: true, image_key: true, stock_quantity: true },
    });

    const parsedData = productUpdateActionSchema.parse(formData);

    let category: Category | null = null;
    if (parsedData.category) {
      category = await categoryRepository.findOrCreate(parsedData.category);
    }

    const { image, name, price, stock_quantity, description, discount } =
      parsedData;

    let image_key = parsedData.image_key || currentProduct?.image_key || "";
    if (image instanceof File) {
      const buffer = Buffer.from(await image.arrayBuffer());

      const uploadResult = await fileUploadService.uploadOptimizedImage(
        image.name,
        image.type,
        image.size,
        buffer,
        { prefix: "product-images" }
      );
      image_key = uploadResult.key;

      if (currentProduct?.image_key && currentProduct.image_key !== image_key) {
        await fileUploadService.deleteFile(currentProduct.image_key);
      }
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
      updateData.data,
      {
        include: {
          category: true,
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }
    );

    const wasOutOfStock = (currentProduct?.stock_quantity ?? 0) <= 0;
    const isNowInStock = updatedProduct.stock_quantity > 0;

    if (wasOutOfStock && isNowInStock) {
      await notifyStockWatchers(
        updatedProduct.id,
        updatedProduct.name,
        updatedProduct.shop.name
      );
    }

    if (
      currentProduct?.category_id &&
      currentProduct.category_id !== category?.id
    ) {
      await categoryRepository.deleteIfEmpty(currentProduct.category_id);
    }

    const serializedProduct = serializeProduct(updatedProduct);

    revalidatePath(`/shops/${updatedProduct.shop_id}`);

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

export interface BulkProductInput {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  discount?: number;
  category?: string;
}

export interface BulkCreateResult {
  created: number;
  products: Array<{ id: string; name: string }>;
}

const bulkProductInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(3, "Name is too short"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  stock_quantity: z.number().min(0, "Stock cannot be negative"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .optional(),
  category: z
    .string()
    .trim()
    .min(2, "Category name is too short")
    .optional()
    .or(z.literal("")),
});

export async function bulkCreateProductsAction(
  products: BulkProductInput[]
): Promise<ActionResponse<BulkCreateResult>> {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to create products");
    }

    const shop_id = context.id;

    if (products.length === 0) {
      throw new InternalServerError("No products provided");
    }

    if (products.length > 50) {
      throw new InternalServerError("Maximum 50 products per batch");
    }

    // 1. Validate and parse all products first (ensures fail-fast and trims inputs)
    const validatedProducts = products.map((product) =>
      bulkProductInputSchema.parse(product)
    );

    const createdProducts: Array<{ id: string; name: string }> = [];

    // 2. Perform insertions using the validated/trimmed products
    for (const productData of validatedProducts) {
      let category = null;
      if (productData.category && productData.category.trim()) {
        category = await categoryRepository.findOrCreate(
          productData.category.trim()
        );
      }

      const newProduct = await productRepository.create({
        data: {
          name: productData.name, // Will be trimmed correctly
          description: productData.description || "",
          price: productData.price,
          stock_quantity: productData.stock_quantity,
          discount: productData.discount,
          image_key: "placeholder",
          shop: {
            connect: { id: shop_id },
          },
          ...(category && {
            category: {
              connect: { id: category.id },
            },
          }),
        },
      });

      createdProducts.push({ id: newProduct.id, name: newProduct.name });
    }

    revalidatePath(`/shops/${shop_id}`);

    return createSuccessResponse(
      {
        created: createdProducts.length,
        products: createdProducts,
      },
      `Successfully created ${createdProducts.length} products`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err) => err.message).join(", ");
      throw new ValidationError(messages);
    }
    console.error("BULK CREATE PRODUCTS ERROR:", error);
    throw new InternalServerError("Failed to create products");
  }
}

const DEFAULT_IN_STOCK_QUANTITY = 99;

export async function toggleProductStockAction(
  productId: string,
  inStock: boolean
): Promise<ActionResponse<SerializedProduct>> {
  try {
    if (!productId || typeof productId !== "string") {
      throw new BadRequestError("Invalid product ID");
    }
    if (typeof inStock !== "boolean") {
      throw new BadRequestError("Invalid availability state");
    }

    const user_id = await authUtils.getUserId();
    const shop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!shop || !shop.id) throw new UnauthorizedError("Unauthorized");

    const product = await productRepository.findById(productId);
    if (!product || product.shop_id !== shop.id) {
      throw new ForbiddenError(
        "You do not have permission to modify this product"
      );
    }

    const updated = await productRepository.update(
      productId,
      {
        stock_quantity: inStock ? DEFAULT_IN_STOCK_QUANTITY : 0,
      },
      {
        include: {
          category: true,
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }
    );

    // Notify stock watchers if transitioning from out of stock to in stock
    const wasOutOfStock = product.stock_quantity <= 0;
    const isNowInStock = updated.stock_quantity > 0;
    if (wasOutOfStock && isNowInStock) {
      await notifyStockWatchers(updated.id, updated.name, updated.shop.name);
    }

    const serialized = serializeProduct(updated);
    revalidatePath(`/shops/${updated.shop_id}`);

    return createSuccessResponse(serialized, "Stock toggled successfully.");
  } catch (error) {
    console.error("TOGGLE PRODUCT STOCK ERROR:", error);
    if (
      error instanceof BadRequestError ||
      error instanceof ForbiddenError ||
      error instanceof UnauthorizedError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to toggle stock.");
  }
}
