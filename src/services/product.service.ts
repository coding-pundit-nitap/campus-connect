import { Prisma, Product } from "@prisma/client";

import { serializeProducts } from "@/lib/utils-functions/product.utils";
import { productRepository } from "@/repositories";
import {
  CreateProductDto,
  UpdateProductDto,
} from "@/repositories/product.repository";
import { SerializedProduct } from "@/types/product.types";

type ServerProductData = {
  initialProducts: SerializedProduct[];
  hasNextPage: boolean;
  nextCursor: string | null;
  error?: string;
};

class ProductService {
  async createProduct(data: CreateProductDto): Promise<Product> {
    return productRepository.create(data);
  }

  async updateProduct(
    product_id: string,
    data: UpdateProductDto
  ): Promise<Product | null> {
    return productRepository.update(product_id, data);
  }

  async deleteProduct(product_id: string): Promise<Product | null> {
    return productRepository.delete(product_id);
  }

  async getProductById(product_id: string) {
    return productRepository.findById(product_id, {
      include: {
        shop: {
          select: {
            name: true,
          },
        },
        category: true,
      },
    });
  }

  async fetchShopProductsServer(shop_id: string): Promise<ServerProductData> {
    try {
      const queryOptions = {
        take: 11,
        orderBy: {
          created_at: Prisma.SortOrder.desc,
        },
        include: { category: true },
      };

      const products = await productRepository.findManyByShopId(
        shop_id,
        queryOptions
      );

      let hasNextPage = false;
      let nextCursor: string | null = null;
      let initialProducts = products;

      if (products.length > 10) {
        hasNextPage = true;
        const lastItem = products.pop();
        nextCursor = lastItem!.id;
        initialProducts = products;
      }

      const serializedProducts = serializeProducts(initialProducts);

      return {
        initialProducts: serializedProducts,
        hasNextPage,
        nextCursor,
      };
    } catch (error) {
      console.error("Error fetching shop products:", error);

      return {
        initialProducts: [],
        hasNextPage: false,
        nextCursor: null,
        error: "Failed to load products. Please try again.",
      };
    }
  }
}

export const productService = new ProductService();
export default productService;
