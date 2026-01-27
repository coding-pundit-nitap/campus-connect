import { prisma } from "@/lib/prisma";

// Define the types locally since we're removing Elasticsearch
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ProductSearchParams extends PaginationParams, SortParams {
  query?: string;
  shopId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface ShopSearchParams extends PaginationParams {
  query?: string;
  isActive?: boolean;
}

interface CategorySearchParams extends PaginationParams {
  query?: string;
  shopId?: string;
}

interface ProductDocument {
  name: string;
  description: string;
  price: number;
  discount: number | null;
  stock_quantity: number;
  image_key: string;
  category_id: string | null;
  category_name: string | null;
  shop_id: string;
  shop_name: string;
  shop_is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ShopDocument {
  id: string;
  name: string;
  description: string;
  location: string;
  image_key: string;
  is_active: boolean;
  created_at: string;
}

interface ESSearchResult<T> {
  hits: (T & { id: string })[];
  total: number;
  page: number;
  totalPages: number;
}
import { SearchResult } from "@/types/search.types";

class PrismaSearchService {
  async searchProducts(
    params: ProductSearchParams
  ): Promise<ESSearchResult<ProductDocument>> {
    const {
      query,
      shopId,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deleted_at: null,
      shop: {
        is_active: true,
        deleted_at: null,
      },
    };

    if (shopId) {
      where.shop_id = shopId;
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock === true) {
      where.stock_quantity = { gt: 0 };
    } else if (inStock === false) {
      where.stock_quantity = { lte: 0 };
    }

    // Add text search if query provided
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          category: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      ];
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === "price") {
      orderBy.price = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "created_at") {
      orderBy.created_at = sortOrder;
    } else {
      orderBy.created_at = "desc";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          shop: { select: { name: true, is_active: true } },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const hits = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      discount: product.discount ? Number(product.discount) : null,
      stock_quantity: product.stock_quantity,
      image_key: product.image_key,
      category_id: product.category_id,
      category_name: product.category?.name || null,
      shop_id: product.shop_id,
      shop_name: product.shop.name,
      shop_is_active: product.shop.is_active,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
    }));

    return {
      hits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchShops(
    params: ShopSearchParams
  ): Promise<ESSearchResult<ShopDocument>> {
    const { query, isActive = true, page = 1, limit = 10 } = params;

    const offset = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    const orderBy = { created_at: "desc" as const };

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    const hits = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      location: shop.location,
      image_key: shop.image_key,
      is_active: shop.is_active,
      created_at: shop.created_at.toISOString(),
    }));

    return {
      hits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchCategories(
    params: CategorySearchParams
  ): Promise<ESSearchResult<any>> {
    const { query, shopId, page = 1, limit = 10 } = params;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (shopId) {
      where.shop_id = shopId;
    }

    if (query && query.trim()) {
      where.name = { contains: query, mode: "insensitive" };
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    const hits = categories.map((category) => ({
      id: category.id,
      name: category.name,
      shop_id: category.shop_id,
    }));

    return {
      hits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async globalSearch(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const [shopResults, productResults, categoryResults] = await Promise.all([
      this.searchShops({ query, limit }),
      this.searchProducts({ query, limit }),
      this.searchCategories({ query, limit }),
    ]);

    const results: SearchResult[] = [
      ...shopResults.hits.map((shop) => ({
        id: shop.id,
        title: shop.name,
        subtitle: shop.location,
        type: "shop" as const,
        image_key: shop.image_key,
      })),
      ...productResults.hits.map((product) => ({
        id: product.id,
        title: product.name,
        subtitle: product.shop_name,
        type: "product" as const,
        image_key: product.image_key,
        shop_id: product.shop_id,
      })),
      ...categoryResults.hits.map((category) => ({
        id: category.id,
        title: category.name,
        subtitle: category.shop_id,
        type: "category" as const,
        image_key: null,
        shop_id: category.shop_id,
      })),
    ];

    return results;
  }
}

export const prismaSearchService = new PrismaSearchService();
export default prismaSearchService;