import { Client, errors } from "@elastic/elasticsearch";

import {
  CATEGORY_MAPPING,
  ORDER_MAPPING,
  PRODUCT_MAPPING,
  SHOP_MAPPING,
  USER_MAPPING,
} from "../search/mappings";

const globalForElastic = global as unknown as {
  __elasticClient?: Client;
};

function createElasticClient(): Client {
  const node = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
  const username = process.env.ES_USERNAME;
  const password = process.env.ES_PASSWORD;

  return new Client({
    node,
    ...(username && password
      ? {
          auth: {
            username,
            password,
          },
        }
      : {}),
  });
}

export const elasticClient =
  globalForElastic.__elasticClient || createElasticClient();

if (process.env.NODE_ENV !== "production")
  globalForElastic.__elasticClient = elasticClient;

export const INDICES = {
  SHOPS: "shops",
  PRODUCTS: "products",
  ORDERS: "orders",
  USERS: "users",
  CATEGORIES: "categories",
};

const INDEX_MAPPINGS = [
  { name: INDICES.SHOPS, mapping: SHOP_MAPPING },
  { name: INDICES.PRODUCTS, mapping: PRODUCT_MAPPING },
  { name: INDICES.ORDERS, mapping: ORDER_MAPPING },
  { name: INDICES.USERS, mapping: USER_MAPPING },
  { name: INDICES.CATEGORIES, mapping: CATEGORY_MAPPING },
];

export async function ensureIndicesExist(): Promise<void> {
  for (const { name, mapping } of INDEX_MAPPINGS) {
    try {
      const exists = await elasticClient.indices.exists({ index: name });
      if (!exists) {
        await elasticClient.indices.create({
          index: name,
          mappings: mapping,
        });
        console.log(`[Elasticsearch] Created index: ${name}`);
      }
    } catch (error) {
      console.error(`[Elasticsearch] Error ensuring index ${name}:`, error);
      throw error;
    }
  }
}

export function isDocumentMissingError(error: unknown): boolean {
  if (error instanceof errors.ResponseError) {
    return error.body?.error?.type === "document_missing_exception";
  }
  return false;
}
