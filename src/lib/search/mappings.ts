export const SHOP_MAPPING = {
  properties: {
    id: { type: "keyword" },
    name: { type: "text", analyzer: "standard" },
    description: { type: "text", analyzer: "standard" },
    location: { type: "text" },
    opening: { type: "keyword" },
    closing: { type: "keyword" },
    image_key: { type: "keyword" },
    is_active: { type: "boolean" },
    verification_status: { type: "keyword" },
    created_at: { type: "date" },
  },
};

export const PRODUCT_MAPPING = {
  properties: {
    id: { type: "keyword" },
    name: { type: "text", analyzer: "standard" },
    description: { type: "text", analyzer: "standard" },
    price: { type: "double" },
    discount: { type: "double" },
    stock_quantity: { type: "integer" },
    shop_id: { type: "keyword" },
    category: { type: "keyword" },
    rating: { type: "float" },
    image_key: { type: "keyword" },
    created_at: { type: "date" },
  },
};

export const ORDER_MAPPING = {
  properties: {
    id: { type: "keyword" },
    shop_id: { type: "keyword" },
    display_id: { type: "text" },
    user_email: { type: "text" },
    delivery_address: { type: "text" },
    status: { type: "keyword" },
    total_price: { type: "double" },
    created_at: { type: "date" },
  },
};

export const USER_MAPPING = {
  properties: {
    id: { type: "keyword" },
    name: { type: "text", analyzer: "standard" },
    email: { type: "text", analyzer: "standard" },
    role: { type: "keyword" },
    shop_id: { type: "keyword" },
    created_at: { type: "date" },
  },
};
