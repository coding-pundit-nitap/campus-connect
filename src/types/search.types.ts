export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "shop" | "product" | "category";
  imageKey: string | null;
  shop_id?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}
