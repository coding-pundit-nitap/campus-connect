import { Client } from "@elastic/elasticsearch";

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
};
