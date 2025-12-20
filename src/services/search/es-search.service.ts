import { elasticClient, INDICES } from "@/lib/elasticsearch";
import { createQueryBuilder } from "@/lib/elasticsearch/query-builder";
import {
  CategoryDocument,
  CategorySearchParams,
  ESSearchResult,
  extractTotal,
  ProductDocument,
  ProductSearchParams,
  ShopDocument,
  ShopSearchParams,
} from "@/lib/elasticsearch/types";
import { SearchResult } from "@/types/search.types";

class ESSearchService {
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

    const queryBuilder = createQueryBuilder()
      .withTextSearch(query ?? "", ["name^3", "description", "category_name"])
      .withTerm("shop_id", shopId)
      .withTerm("category_id", categoryId)
      .withTerm("shop_is_active", true)
      .withRange("price", minPrice, maxPrice)
      .withPagination(page, limit)
      .withSort(sortBy, sortOrder);

    if (inStock === true) {
      queryBuilder.withRange("stock_quantity", 1, undefined);
    } else if (inStock === false) {
      queryBuilder.withRange("stock_quantity", undefined, 0);
    }

    const esQuery = queryBuilder.build();

    const result = await elasticClient.search<ProductDocument>({
      index: INDICES.PRODUCTS,
      ...esQuery,
    });

    const hits = result.hits.hits.map((hit) => ({
      id: hit._id ?? "",
      ...hit._source!,
    }));

    const total = extractTotal(result.hits.total);

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

    const queryBuilder = createQueryBuilder()
      .withTextSearch(query ?? "", ["name^3", "description", "location"])
      .withTerm("is_active", isActive)
      .withPagination(page, limit);

    // Add relevance scoring if there's a query
    if (query && query.trim()) {
      queryBuilder.withScoreSort();
    } else {
      queryBuilder.withSort("created_at", "desc");
    }

    const esQuery = queryBuilder.build();

    const result = await elasticClient.search<ShopDocument>({
      index: INDICES.SHOPS,
      ...esQuery,
    });

    const hits = result.hits.hits.map((hit) => ({
      id: hit._id ?? "",
      ...hit._source!,
    }));

    const total = extractTotal(result.hits.total);

    return {
      hits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchCategories(
    params: CategorySearchParams
  ): Promise<ESSearchResult<CategoryDocument>> {
    const { query, shopId, page = 1, limit = 10 } = params;

    const queryBuilder = createQueryBuilder()
      .withTextSearch(query ?? "", ["name^3"])
      .withTerm("shop_id", shopId)
      .withPagination(page, limit);

    if (query && query.trim()) {
      queryBuilder.withScoreSort();
    }

    const esQuery = queryBuilder.build();

    const result = await elasticClient.search<CategoryDocument>({
      index: INDICES.CATEGORIES,
      ...esQuery,
    });

    const hits = result.hits.hits.map((hit) => ({
      id: hit._id ?? "",
      ...hit._source!,
    }));

    const total = extractTotal(result.hits.total);

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

    const [shopResults, productResults] = await Promise.all([
      this.searchShops({ query, limit }),
      this.searchProducts({ query, limit }),
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
    ];

    return results;
  }
}

export const esSearchService = new ESSearchService();
export default esSearchService;
