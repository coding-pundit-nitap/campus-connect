import { Prisma, Product } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { serializeProducts } from "@/lib/utils";
import {
  CreateProductDto,
  ProductRepository,
  UpdateProductDto,
} from "@/repositories/product.repository";
import { SerializedProduct } from "@/types/product.types";
const log = createLogger("product.service");

export type ServerProductData = {
  initialProducts: SerializedProduct[];
  hasNextPage: boolean;
  nextCursor: string | null;
  error?: string;
};

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.productRepository.create({ data });
  }

  async updateProduct(
    product_id: string,
    data: UpdateProductDto
  ): Promise<Product | null> {
    return this.productRepository.update(product_id, data);
  }

  async deleteProduct(product_id: string): Promise<Product | null> {
    return this.productRepository.delete(product_id);
  }

  async getProductById(product_id: string) {
    return this.productRepository.findById(product_id, {
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
    categoryId,
    hasDiscount,
  }: {
    limit: number;
    cursor?: string;
    categoryId?: string;
    hasDiscount?: boolean;
  }): Promise<ServerProductData> {
    const queryOptions = {
      take: limit + 1,
      where: {
        shop: {
          is_active: true,
          deleted_at: null,
        },
        deleted_at: null,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(hasDiscount
          ? {
              discount: {
                not: null,
                gt: 0,
              },
            }
          : {}),
      },
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
        brand: true,
      },
    };

    const baseQuery = cursor
      ? {
          ...queryOptions,
          cursor: { id: cursor },
          skip: 1,
        }
      : queryOptions;

    const products = await this.productRepository.findMany(baseQuery);

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
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive" as const,
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
        name: "asc" as const,
      },
      take: limit,
    };

    return this.productRepository.findMany(queryOptions);
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
          brand: true,
        },
      } as const;

      const products = await this.productRepository.findManyByShopId(
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
      log.error({ err: error }, "Error fetching shop products:");

      return {
        initialProducts: [],
        hasNextPage: false,
        nextCursor: null,
        error: "Failed to load products. Please try again.",
      };
    }
  }
}
