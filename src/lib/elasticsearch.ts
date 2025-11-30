import { Client } from "@elastic/elasticsearch";

const globalForElastic = global as unknown as {
  __elasticClient?: Client;
};

export const elasticClient =
  globalForElastic.__elasticClient ||
  new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  });

if (process.env.NODE_ENV !== "production")
  globalForElastic.__elasticClient = elasticClient;

export const INDICES = {
  SHOPS: "shops",
  PRODUCTS: "products",
  ORDERS: "orders",
  USERS: "users",
};
