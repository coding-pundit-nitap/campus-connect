import { Cart, CartItem, Product } from "@prisma/client";

import { FormFieldConfig } from "@/types";
import { ProductFormData } from "@/validations";

export type SerializedProduct = Omit<Product, "price" | "discount"> & {
  price: number;
  discount: number | null;
};

export type SerializedFullCart = Cart & {
  items: (CartItem & { product: SerializedProduct })[];
};

const SORT_OPTIONS = [
  { value: "created_at-desc", label: "Newest First" },
  { value: "created_at-asc", label: "Oldest First" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "price-asc", label: "Price Low-High" },
  { value: "price-desc", label: "Price High-Low" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
];

const PRODUCT_FORM_FIELDS: FormFieldConfig<ProductFormData>[] = [
  { name: "name", label: "Product Name", type: "text", required: true },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: true,
  },
  { name: "price", label: "Price", type: "number", required: true },
  {
    name: "stock_quantity",
    label: "Stock Quantity",
    type: "number",
    required: true,
  },
  { name: "discount", label: "Discount", type: "number", required: false },
  {
    name: "image_url",
    label: "Product Image",
    type: "file",
    accept: "image/*",
    maxSize: 5,
    required: false,
  },
];

export interface FilterState {
  search: string;
  priceRange: { min: number; max: number };
  inStock: boolean | null;
  sortBy: "name" | "price" | "created_at" | "rating";
  sortOrder: "asc" | "desc";
}

export interface ActiveFilter {
  label: string;
  value: string;
  onRemove: () => void;
}

export const createDefaultFilterState = (): FilterState => ({
  search: "",
  priceRange: { min: 0, max: 100000 },
  inStock: null,
  sortBy: "created_at",
  sortOrder: "desc",
});

export const serializeProduct = (product: Product): SerializedProduct => ({
  ...product,
  price: Number(product.price),
  discount: product.discount ? Number(product.discount) : null,
});

export const serializeProducts = (products: Product[]): SerializedProduct[] =>
  products.map(serializeProduct);

export const serializeFullCart = (
  cart: Cart & { items: (CartItem & { product: Product })[] }
): SerializedFullCart => ({
  ...cart,
  items: cart.items.map((item) => ({
    ...item,
    product: serializeProduct(item.product),
  })),
});

export const serializeFullCarts = (
  carts: (Cart & { items: (CartItem & { product: Product })[] })[]
): SerializedFullCart[] => carts.map(serializeFullCart);

export class ProductUIServices {
  calculateDiscountedPrice(product: SerializedProduct): number {
    if (!product.discount || product.discount <= 0) {
      return product.price;
    }
    return product.price - product.discount;
  }

  formatProductDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  getProductCountMessage(displayCount: number, totalCount: number): string {
    return `Showing ${displayCount} of ${totalCount} products`;
  }

  createProductFormFields(): FormFieldConfig<ProductFormData>[] {
    return PRODUCT_FORM_FIELDS;
  }

  getSortOptions() {
    return SORT_OPTIONS;
  }

  applyAllFilters(
    products: SerializedProduct[],
    filters: FilterState
  ): SerializedProduct[] {
    return products
      .filter((product) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !product.name.toLowerCase().includes(searchLower) &&
            !product.description?.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        const price = product.price;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }

        if (filters.inStock !== null) {
          const hasStock = product.stock_quantity > 0;
          if (filters.inStock !== hasStock) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "price":
            comparison = a.price - b.price;
            break;
          case "created_at":
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case "rating":
            comparison = a.rating - b.rating;
            break;
        }
        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
  }

  hasActiveFilters(filters: FilterState): boolean {
    return !!(
      filters.search ||
      filters.priceRange.min !== 0 ||
      filters.priceRange.max !== 100000 ||
      filters.inStock !== null
    );
  }

  parseSortValueToOptions(value: string): {
    sortBy: FilterState["sortBy"];
    sortOrder: FilterState["sortOrder"];
  } {
    const [sortBy, sortOrder] = value.split("-") as [
      FilterState["sortBy"],
      FilterState["sortOrder"],
    ];
    return { sortBy, sortOrder };
  }

  handlePriceRangeChange(
    min: number | null,
    max: number | null
  ): { min: number; max: number } {
    return {
      min: min ?? 0,
      max: max ?? 100000,
    };
  }

  getProductCardProps(product: SerializedProduct, index: number) {
    return {
      discountedPrice: this.calculateDiscountedPrice(product).toFixed(2),
      formattedDate: this.formatProductDate(product.created_at),
      productHasDiscount: product.discount !== null && product.discount > 0,
      productHasRating: product.rating !== null && product.rating > 0,
      priority: index < 4,
    };
  }

  createActiveFilters(
    filters: FilterState,
    clearSearchFilter: () => void,
    clearPriceFilter: () => void,
    clearStockFilter: () => void
  ): ActiveFilter[] {
    const activeFilters: ActiveFilter[] = [];

    if (filters.search) {
      activeFilters.push({
        label: "Search",
        value: filters.search,
        onRemove: clearSearchFilter,
      });
    }

    if (filters.priceRange.min !== 0 || filters.priceRange.max !== 100000) {
      activeFilters.push({
        label: "Price",
        value: `${filters.priceRange.min} - ${filters.priceRange.max === 100000 ? "∞" : filters.priceRange.max}`,
        onRemove: clearPriceFilter,
      });
    }

    if (filters.inStock !== null) {
      activeFilters.push({
        label: filters.inStock ? "In Stock" : "Out of Stock",
        value: "",
        onRemove: clearStockFilter,
      });
    }

    return activeFilters;
  }

  createFilterUpdaters(updateFilter: (update: Partial<FilterState>) => void) {
    return {
      updateSearch: (search: string) => updateFilter({ search }),
      updatePriceRange: (min: number, max: number) =>
        updateFilter({ priceRange: { min, max } }),
      updateStockFilter: (inStock: boolean | null) => updateFilter({ inStock }),
      updateSort: (
        sortBy: FilterState["sortBy"],
        sortOrder: FilterState["sortOrder"]
      ) => updateFilter({ sortBy, sortOrder }),
      clearSearchFilter: () => updateFilter({ search: "" }),
      clearPriceFilter: () =>
        updateFilter({
          priceRange: { min: 0, max: 100000 },
        }),
      clearStockFilter: () => updateFilter({ inStock: null }),
    };
  }
}

export const productUIServices = new ProductUIServices();
