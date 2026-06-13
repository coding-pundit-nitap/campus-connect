export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "shop" | "product" | "category" | "brand";
  image_key: string | null;
  shop_id?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}
