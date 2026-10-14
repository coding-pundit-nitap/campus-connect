"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/actions/_shared/action-helpers";
import {
  brandRepository,
  cartRepository,
  categoryRepository,
  fileUploadService,
  notificationService,
  productRepository,
  shopRepository,
} from "@/di/container";
import { Brand, Category, Prisma } from "@/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { serializeProduct } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";
import { notifyStockWatchers } from "@/services/notification/stock-watch-notification.service";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
import {
  ProductActionFormData,
  productActionSchema,
  ProductUpdateActionFormData,
  productUpdateActionSchema,
} from "@/validations/product";
const log = createLogger("product-actions");

const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
  shop: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

/** Errors the product-editing actions rethrow untouched. */
const EDIT_ERRORS = [
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
];

/** Errors the quick-edit (stock/price) actions rethrow untouched. */
const QUICK_EDIT_ERRORS = [
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  InternalServerError,
];

/** Id of the shop owned by the current user, or UnauthorizedError(message). */
async function requireOwnerShopId(message: string): Promise<string> {
  const user_id = await authUtils.getUserId();
  const shop = await shopRepository.findByOwnerId(user_id, {
    select: { id: true },
  });
  if (!shop || !shop.id) {
    throw new UnauthorizedError(message);
  }
  return shop.id;
}

/** Product of `productId` when it belongs to `shopId`, else ForbiddenError. */
async function requireOwnedProduct(productId: string, shopId: string) {
  const product = await productRepository.findById(productId);
  if (!product || product.shop_id !== shopId) {
    throw new ForbiddenError(
      "You do not have permission to modify this product"
    );
  }
  return product;
}

async function uploadProductImage(image: File) {
  const buffer = Buffer.from(await image.arrayBuffer());
  return fileUploadService.uploadOptimizedImage(
    image.name,
    image.type,
    image.size,
    buffer,
    { prefix: "product-images" }
  );
}

export async function createProductAction(
  formData: ProductActionFormData
): Promise<ActionResponse<SerializedProduct>> {
  let uploadedImageKey: string | null = null;

  try {
    const shop_id = await requireOwnerShopId(
      "User is not authorized to create a product"
    );

    const parsedData = productActionSchema.parse(formData);

    const category = await categoryRepository.findOrCreate(parsedData.category);
    const brand = await brandRepository.findOrCreate(parsedData.brand);

    const { image, name, price, stock_quantity, description, discount } =
      parsedData;
    let image_key = "";
    if (image) {
      const uploadResult = await uploadProductImage(image as File);

      image_key = uploadResult.key;
      uploadedImageKey = image_key;

      log.debug(
        `Product image optimized: ${uploadResult.compressionRatio}% reduction`
      );
    }
    const productData: Prisma.ProductCreateInput = {
      image_key,
      name,
      price,
      stock_quantity,
      description,
      discount,
      shop: {
        connect: { id: shop_id },
      },
      category: {
        connect: { id: category.id },
      },
      brand: {
        connect: {
          id: brand.id,
        },
      },
    };

    const newProduct = await productRepository.create({
      data: productData,
      include: PRODUCT_INCLUDE,
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
        log.error(
          { err: cleanupError },
          `Failed to cleanup file ${uploadedImageKey} after product creation failure:`
        );
      }
    }

    log.error({ err: error }, "CREATE PRODUCT ERROR:");
    throw new InternalServerError("Failed to create product.");
  }
}

export async function updateProductAction(
  product_id: string,
  formData: ProductUpdateActionFormData
): Promise<ActionResponse<SerializedProduct>> {
  return runAction(
    log,
    {
      label: "UPDATE PRODUCT ERROR:",
      fallback: "Failed to update product",
      passthrough: EDIT_ERRORS,
    },
    async () => {
      const shop_id = await requireOwnerShopId(
        "User is not authorized to update a product"
      );

      const currentProduct = await productRepository.findById(product_id, {
        select: {
          category_id: true,
          image_key: true,
          stock_quantity: true,
          brand_id: true,
          shop_id: true,
        },
      });

      if (!currentProduct || currentProduct.shop_id !== shop_id) {
        throw new ForbiddenError(
          "You do not have permission to modify this product"
        );
      }

      const parsedData = productUpdateActionSchema.parse(formData);
      const brand: Brand | null = parsedData.brand
        ? await brandRepository.findOrCreate(parsedData.brand)
        : null;
      const category: Category | null = parsedData.category
        ? await categoryRepository.findOrCreate(parsedData.category)
        : null;

      const { image, name, price, stock_quantity, description, discount } =
        parsedData;

      let image_key = parsedData.image_key || currentProduct.image_key || "";
      if (image instanceof File) {
        image_key = (await uploadProductImage(image)).key;

        if (
          currentProduct.image_key &&
          currentProduct.image_key !== image_key
        ) {
          await fileUploadService.deleteFile(currentProduct.image_key);
        }
      }

      const updateData: Prisma.ProductUpdateInput = {
        image_key,
        name,
        price,
        stock_quantity,
        description,
        discount,
        category: category
          ? { connect: { id: category.id } }
          : { disconnect: true },
        brand: brand ? { connect: { id: brand.id } } : { disconnect: true },
      };

      const updatedProduct = await productRepository.update(
        product_id,
        updateData,
        { include: PRODUCT_INCLUDE }
      );

      const wasOutOfStock = (currentProduct.stock_quantity ?? 0) <= 0;
      const isNowInStock = updatedProduct.stock_quantity > 0;

      if (wasOutOfStock && isNowInStock) {
        await notifyStockWatchers(
          updatedProduct.id,
          updatedProduct.name,
          updatedProduct.shop.name
        );
      }

      if (
        currentProduct.category_id &&
        currentProduct.category_id !== category?.id
      ) {
        await categoryRepository.deleteIfEmpty(currentProduct.category_id);
      }

      if (currentProduct.brand_id && currentProduct.brand_id !== brand?.id) {
        await brandRepository.deleteIfEmpty(currentProduct.brand_id);
      }

      revalidatePath(`/shops/${updatedProduct.shop_id}`);

      return createSuccessResponse(
        serializeProduct(updatedProduct),
        "Product updated successfully"
      );
    }
  );
}

export async function deleteProductAction(
  product_id: string
): Promise<ActionResponse<null>> {
  return runAction(
    log,
    {
      label: "DELETE PRODUCT ERROR:",
      fallback: "Failed to delete product",
      passthrough: EDIT_ERRORS,
    },
    async () => {
      const shop_id = await requireOwnerShopId(
        "User is not authorized to delete a product"
      );

      const productToDelete = await productRepository.findById(product_id, {
        select: {
          category_id: true,
          shop_id: true,
          name: true,
          brand_id: true,
        },
      });

      if (!productToDelete) {
        throw new InternalServerError("Product not found");
      }

      if (productToDelete.shop_id !== shop_id) {
        throw new ForbiddenError(
          "You do not have permission to delete this product"
        );
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
              log.error({ err: err }, `Failed to notify user ${userId}:`)
            )
        )
      );

      await productRepository.delete(product_id);

      if (productToDelete.category_id) {
        await categoryRepository.deleteIfEmpty(productToDelete.category_id);
      }

      if (productToDelete.brand_id) {
        await brandRepository.deleteIfEmpty(productToDelete.brand_id);
      }

      return createSuccessResponse(null, "Product deleted successfully");
    }
  );
}

export interface BulkProductInput {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  discount?: number;
  category?: string;
  brand?: string;
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
  brand: z
    .string()
    .trim()
    .min(2, "Brand name is too short")
    .optional()
    .or(z.literal("")),
});

export async function bulkCreateProductsAction(
  products: BulkProductInput[]
): Promise<ActionResponse<BulkCreateResult>> {
  try {
    const shop_id = await requireOwnerShopId(
      "User is not authorized to create products"
    );

    if (products.length === 0) {
      throw new InternalServerError("No products provided");
    }

    if (products.length > 50) {
      throw new InternalServerError("Maximum 50 products per batch");
    }

    const validatedProducts = products.map((product) =>
      bulkProductInputSchema.parse(product)
    );

    const createdProducts: Array<{ id: string; name: string }> = [];

    for (const productData of validatedProducts) {
      let category: Category | null = null;
      if (productData.category && productData.category.trim()) {
        category = await categoryRepository.findOrCreate(
          productData.category.trim()
        );
      }
      let brand: Brand | null = null;
      if (productData.brand && productData.brand.trim()) {
        brand = await brandRepository.findOrCreate(productData.brand.trim());
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
          ...(brand && {
            brand: {
              connect: { id: brand.id },
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
    log.error({ err: error }, "BULK CREATE PRODUCTS ERROR:");
    throw new InternalServerError("Failed to create products");
  }
}

const DEFAULT_IN_STOCK_QUANTITY = 99;

export async function toggleProductStockAction(
  productId: string,
  inStock: boolean
): Promise<ActionResponse<SerializedProduct>> {
  return runAction(
    log,
    {
      label: "TOGGLE PRODUCT STOCK ERROR:",
      fallback: "Failed to toggle stock.",
      passthrough: QUICK_EDIT_ERRORS,
    },
    async () => {
      if (!productId || typeof productId !== "string") {
        throw new BadRequestError("Invalid product ID");
      }
      if (typeof inStock !== "boolean") {
        throw new BadRequestError("Invalid availability state");
      }

      const shop_id = await requireOwnerShopId("Unauthorized");
      const product = await requireOwnedProduct(productId, shop_id);

      const updated = await productRepository.update(
        productId,
        { stock_quantity: inStock ? DEFAULT_IN_STOCK_QUANTITY : 0 },
        { include: PRODUCT_INCLUDE }
      );

      const wasOutOfStock = product.stock_quantity <= 0;
      const isNowInStock = updated.stock_quantity > 0;
      if (wasOutOfStock && isNowInStock) {
        await notifyStockWatchers(updated.id, updated.name, updated.shop.name);
      }

      revalidatePath(`/shops/${updated.shop_id}`);

      return createSuccessResponse(
        serializeProduct(updated),
        "Stock toggled successfully."
      );
    }
  );
}

export async function updateProductPriceAction(
  productId: string,
  price: number
): Promise<ActionResponse<SerializedProduct>> {
  return runAction(
    log,
    {
      label: "UPDATE PRODUCT PRICE ERROR:",
      fallback: "Failed to update price.",
      passthrough: QUICK_EDIT_ERRORS,
    },
    async () => {
      if (!productId || typeof productId !== "string") {
        throw new BadRequestError("Invalid product ID");
      }
      if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
        throw new BadRequestError("Price must be a non-negative number");
      }

      const shop_id = await requireOwnerShopId("Unauthorized");
      await requireOwnedProduct(productId, shop_id);

      const updated = await productRepository.update(
        productId,
        { price },
        { include: PRODUCT_INCLUDE }
      );

      revalidatePath(`/shops/${updated.shop_id}`);

      return createSuccessResponse(
        serializeProduct(updated),
        "Price updated successfully."
      );
    }
  );
}
