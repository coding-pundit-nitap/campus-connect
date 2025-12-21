import { NextResponse } from "next/server";

import { serializeProducts, SortBy } from "@/lib/utils/product.utils";
import productRepository from "@/repositories/product.repository";
import { esSearchService } from "@/services/search/es-search.service";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id } = await params;

    if (!shop_id) {
      const errorResponse = createErrorResponse("Shop ID is required.");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor") || undefined;
    const sortBy = searchParams.get("sortBy") as SortBy | undefined;
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const inStockParam = searchParams.get("inStock");
    const inStock =
      inStockParam === "true"
        ? true
        : inStockParam === "false"
          ? false
          : undefined;

    const VALID_SORT_FIELDS = ["name", "price", "created_at", "stock_quantity"];
    const effectiveSortBy =
      sortBy && VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";

    if (search || categoryId || inStock !== undefined) {
      const page = cursor ? parseInt(cursor, 10) : 1;
      const esResponse = await esSearchService.searchProducts({
        query: search,
        shopId: shop_id,
        categoryId,
        inStock,
        sortBy: effectiveSortBy,
        sortOrder,
        limit,
        page,
      });
      const nextCursor = page < esResponse.totalPages ? String(page + 1) : null;

      const responseData = {
        data: esResponse.hits.map((hit) => ({
          id: hit.id,
          name: hit.name,
          description: hit.description,
          price: hit.price,
          discount: hit.discount,
          stock_quantity: hit.stock_quantity,
          image_key: hit.image_key,
          category_id: hit.category_id,
          shop_id: hit.shop_id,
          category: hit.category_name
            ? { id: hit.category_id, name: hit.category_name }
            : null,
          shop: { id: hit.shop_id, name: hit.shop_name },
          rating: 0,
          created_at: hit.created_at,
          updated_at: hit.updated_at,
        })),
        nextCursor,
      };

      return NextResponse.json(
        createSuccessResponse(responseData, "Products retrieved successfully")
      );
    }

    const queryOptions = {
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { [effectiveSortBy]: sortOrder },
      include: {
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    };

    const products = await productRepository.findManyByShopId(
      shop_id,
      queryOptions
    );

    let nextCursor: typeof cursor | null = null;
    if (products.length > limit) {
      const lastItem = products.pop();
      nextCursor = lastItem!.id;
    }

    const responseData = {
      data: serializeProducts(products),
      nextCursor,
    };
    const successResponse = createSuccessResponse(
      responseData,
      "Products retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
