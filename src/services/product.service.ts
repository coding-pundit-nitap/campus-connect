import { Prisma, Product } from "@prisma/client";

import { serializeProducts } from "@/lib/utils-functions/product.utils";
import { productRepository } from "@/repositories";
import {
  CreateProductDto,
  UpdateProductDto,
} from "@/repositories/product.repository";
import { SerializedProduct } from "@/types/product.types";

export type ServerProductData = {
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
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });
  }

  async getPaginatedProducts({
    limit = 20,
    cursor,
  }: {
    limit: number;
    cursor?: string;
  }): Promise<ServerProductData> {
    const queryOptions = {
      take: limit + 1,
      orderBy: {
        orderItems: {
          _count: Prisma.SortOrder.desc,
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    } as const;

    const baseQuery = cursor
      ? {
          ...queryOptions,
          cursor: { id: cursor },
          skip: 1,
        }
      : queryOptions;

    const products = await productRepository.findMany(baseQuery);

    let hasNextPage = false;
    let nextCursor: string | null = null;
    let initialProducts = products;

    if (products.length > limit) {
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
  }

  async searchProducts(
    searchTerm: string,
    limit: number = 10
  ): Promise<
    (Product & {
      shop: {
        id: string;
        name: string;
      };
    })[]
  > {
    const queryOptions = {
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
        shop: {
          is_active: true,
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    } as const;

    return productRepository.findMany(queryOptions);
  }

  async fetchShopProducts(shop_id: string): Promise<ServerProductData> {
    try {
      const queryOptions = {
        take: 11,
        orderBy: {
          created_at: Prisma.SortOrder.desc,
        },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
          category: true,
        },
      } as const;

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
