"use server";

import { auth } from "@/auth";
import { productSchema } from "@/lib/validations/product";
import productServices from "@/services/product.services";
import { createErrorResponse, createSuccessResponse } from "@/types/response.type";

export async function createProductAction(formData: FormData) {
  try {
    const session = await auth();
    const shop_id = session?.user?.shop_id;
    if (!shop_id) {
      return createErrorResponse("User is not associated with a shop");
    }

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
    const newProduct = await productServices.createProduct({
      ...parsedData.data,
      image_url: "",
      shop: {
        connect: { id: shop_id },
      },
    });

    // TODO: revalidate

    return createSuccessResponse(newProduct, "Product created successfully");
  } catch (error) {
    return createErrorResponse("An error occurred while creating the product");
  }
}
