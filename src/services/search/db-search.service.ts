import { Prisma, ShopType } from "@/generated/client";
import {
  CategoryRepository,
  categoryRepository,
} from "@/repositories/category.repository";
import {
  ProductRepository,
  productRepository,
} from "@/repositories/product.repository";
import { ShopRepository, shopRepository } from "@/repositories/shop.repository";
import { SearchResult } from "@/types/search.types";

export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ProductSearchParams extends PaginationParams, SortParams {
  query?: string;
  shopId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  brand?: string;
  is_veg?: boolean;
  shop_type?: ShopType;
}

export interface ShopSearchParams extends PaginationParams {
  query?: string;
  isActive?: boolean;
}

export interface CategorySearchParams extends PaginationParams {
  query?: string;
}

export interface ProductDocument {
  name: string;
  description: string | null;
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
  brand: string | null;
  is_veg: boolean | null;
}

export interface ShopDocument {
  name: string;
  description: string;
  location: string;
  image_key: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryDocument {
  name: string;
}

export interface DBSearchResult<T> {
  hits: (T & { id: string })[];
  total: number;
  page: number;
  total_pages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const PRODUCT_SORT_FIELDS: Record<string, Prisma.SortOrder> = {
  created_at: "desc",
  updated_at: "desc",
  name: "asc",
  price: "asc",
  stock_quantity: "desc",
};

export class DBSearchService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly shopRepository: ShopRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async searchProducts(
    params: ProductSearchParams
  ): Promise<DBSearchResult<ProductDocument>> {
    const {
      query,
      shopId,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      brand,
      is_veg,
      shop_type,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    const shopWhere: Prisma.ShopWhereInput = {
      is_active: true,
      deleted_at: null,
    };

    if (shop_type) {
      shopWhere.shop_type = shop_type;
    }

    const where: Prisma.ProductWhereInput = {
      deleted_at: null,
      shop: shopWhere,
    };

    if (shopId) {
      where.shop_id = shopId;
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      where.price = {
        gte: typeof minPrice === "number" ? minPrice : undefined,
        lte: typeof maxPrice === "number" ? maxPrice : undefined,
      };
    }

    if (inStock === true) {
      where.stock_quantity = { gt: 0 };
    } else if (inStock === false) {
      where.stock_quantity = { lte: 0 };
    }

    if (brand) {
      where.brand = brand;
    }

    if (typeof is_veg === "boolean") {
      where.is_veg = is_veg;
    }

    if (query && query.trim()) {
      const trimmed = query.trim();
      where.OR = [
        { name: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { category: { name: { contains: trimmed, mode: "insensitive" } } },
        { shop: { name: { contains: trimmed, mode: "insensitive" } } },
      ];
    }

    const orderByField = PRODUCT_SORT_FIELDS[sortBy] ? sortBy : "created_at";
    const orderByDirection: Prisma.SortOrder =
      sortOrder === "asc" ? "asc" : "desc";

    const [products, total] = await Promise.all([
      this.productRepository.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          category: true,
          shop: { select: { id: true, name: true, is_active: true } },
        },
        orderBy: {
          [orderByField]: orderByDirection,
        },
      }),
      this.productRepository.count({ where }),
    ]);

    const hits = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      price: Number(product.price),
      discount: product.discount ? Number(product.discount) : null,
      stock_quantity: product.stock_quantity,
      image_key: product.image_key,
      category_id: product.category_id,
      category_name: product.category?.name ?? null,
      shop_id: product.shop_id,
      shop_name: product.shop.name,
      shop_is_active: product.shop.is_active,
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
      brand: product.brand ?? null,
      is_veg: product.is_veg ?? null,
    }));

    return {
      hits,
      total,
      page,
      total_pages: Math.ceil(total / limit),
    };
  }

  async searchShops(
    params: ShopSearchParams
  ): Promise<DBSearchResult<ShopDocument>> {
    const {
      query,
      isActive = true,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = params;

    const where: Prisma.ShopWhereInput = {
      deleted_at: null,
    };

    if (typeof isActive === "boolean") {
      where.is_active = isActive;
    }

    if (query && query.trim()) {
      const trimmed = query.trim();
      where.OR = [
        { name: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { location: { contains: trimmed, mode: "insensitive" } },
      ];
    }

    const [shops, total] = await Promise.all([
      this.shopRepository.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: query?.trim() ? { name: "asc" } : { created_at: "desc" },
      }),
      this.shopRepository.count({ where }),
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
      total_pages: Math.ceil(total / limit),
    };
  }

  async searchCategories(
    params: CategorySearchParams
  ): Promise<DBSearchResult<CategoryDocument>> {
    const { query, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = params;

    const where: Prisma.CategoryWhereInput = {};

    if (query && query.trim()) {
      const trimmed = query.trim();
      where.name = { contains: trimmed, mode: "insensitive" };
    }

    const [categories, total] = await Promise.all([
      this.categoryRepository.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: "asc" },
      }),
      this.categoryRepository.count({ where }),
    ]);

    const hits = categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));

    return {
      hits,
      total,
      page,
      total_pages: Math.ceil(total / limit),
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
        subtitle: "category",
        type: "category" as const,
        image_key: null,
      })),
    ];

    return results;
  }
}

export const dbSearchService = new DBSearchService(
  productRepository,
  shopRepository,
  categoryRepository
);
export default dbSearchService;
