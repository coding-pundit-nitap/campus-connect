const items = {
  shopping_complex_items: {
    "food court": [
      {
        item_id: "fc_001",
        item_name: "Veggie Burger",
        price: 60.0,
        description:
          "Classic vegetable patty with fresh lettuce, tomato, and a tangy sauce.",
        category: "Main Course",
        is_vegetarian: true,
      },
      {
        item_id: "fc_002",
        item_name: "Chicken Shawarma Roll",
        price: 90.0,
        description:
          "Spicy chicken slices with hummus, vegetables, wrapped in a fresh pita bread.",
        category: "Snacks",
        is_vegetarian: false,
      },
      {
        item_id: "fc_003",
        item_name: "French Fries",
        price: 40.0,
        description: "Crispy golden fried potato sticks, salted to perfection.",
        category: "Snacks",
        is_vegetarian: true,
      },
      {
        item_id: "fc_004",
        item_name: "Cold Coffee",
        price: 55.0,
        description: "Rich and creamy cold coffee, blended with ice and milk.",
        category: "Beverages",
        is_vegetarian: true,
      },
      {
        item_id: "fc_005",
        item_name: "Mango Shake",
        price: 65.0,
        description: "Thick and refreshing shake made from real mangoes.",
        category: "Beverages",
        is_vegetarian: true,
      },
    ],
    "stationery store": [
      {
        item_id: "st_001",
        item_name: "A4 Notebook (200 pages)",
        price: 35.0,
        description:
          "Spiral bound notebook with high-quality paper, suitable for all subjects.",
        category: "Notebooks",
        stock: 150,
      },
      {
        item_id: "st_002",
        item_name: "Black Gel Pen",
        price: 10.0,
        description: "Smooth writing gel pen with a 0.5mm tip.",
        category: "Pens",
        stock: 500,
      },
      {
        item_id: "st_003",
        item_name: "Pencil Box",
        price: 50.0,
        description: "Hard-cased pencil box with multiple compartments.",
        category: "School Supplies",
        stock: 80,
      },
      {
        item_id: "st_004",
        item_name: "Scientific Calculator",
        price: 250.0,
        description:
          "Advanced scientific calculator for engineering and science students.",
        category: "Electronics",
        stock: 30,
      },
      {
        item_id: "st_005",
        item_name: "Stapler and Pins",
        price: 45.0,
        description: "Set of a mini stapler and a box of 1000 pins.",
        category: "Office Supplies",
        stock: 90,
      },
    ],
    "convenience store": [
      {
        item_id: "cs_001",
        item_name: "Bottled Water (1L)",
        price: 20.0,
        description: "Fresh and pure bottled drinking water.",
        category: "Beverages",
        stock: 200,
      },
      {
        item_id: "cs_002",
        item_name: "Packet of Chips",
        price: 25.0,
        description: "Assorted flavors of a popular brand of potato chips.",
        category: "Snacks",
        stock: 180,
      },
      {
        item_id: "cs_003",
        item_name: "Instant Noodles",
        price: 30.0,
        description:
          "Quick-to-make instant noodles, a college student favorite.",
        category: "Instant Food",
        stock: 100,
      },
      {
        item_id: "cs_004",
        item_name: "Soap Bar",
        price: 40.0,
        description: "Regular sized bathing soap bar.",
        category: "Toiletries",
        stock: 50,
      },
      {
        item_id: "cs_005",
        item_name: "Shampoo Sachet",
        price: 5.0,
        description: "Single-use shampoo sachet.",
        category: "Toiletries",
        stock: 300,
      },
    ],
  },
};

export default items;
