"use client";

import { Minus, Plus,ShoppingCart, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  image: string;
  sizes: string[];
  specifications: Record<string, string>;
}

const sampleProduct: Product = {
  id: "1",
  name: "Spicy Triple Tango Pizza",
  brand: "RJ's Pizza Shop",
  description:
    "A fiery trio of spicy paneer, red paprika, and jalapenos combined with crunchy onions and capsicum for a truly tangy experience.",
  price: 299,
  originalPrice: 499,
  discount: 40,
  rating: 4.4,
  reviewCount: 96,
  image: "/pizza2.jpg",
  sizes: ["Regular", "Medium", "Large"],
  specifications: {
    "Base Ingredients": "Refined Wheat Flour, Yeast, Olive Oil",
    Toppings: "Paneer, Onion, Capsicum, Red Paprika, Jalapeno",
    Sauce: "Spicy Red Sauce, Mozzarella Cheese",
    Serves: "1-2 People (Regular)",
  },
};

// Quantity Selector
const QuantitySelector = ({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: (q: number) => void;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-10 text-center font-bold">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setQuantity(quantity + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function ProductPage() {
  const product = sampleProduct;
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    console.log(`Added ${quantity} x ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    console.log(`Buying ${quantity} x  ${product.name} now`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- LEFT COLUMN: Image Gallery & Action Buttons --- */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Card className="sticky top-6">
            <CardContent className="items-center justify-center flex gap-4">
              {/* Main Image */}
              <Image
                src={product.image}
                width={300}
                height={300}
                alt={product.name}
                className="object-scale-down p-2"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex pt-4 gap-5 w-full">
            <Button
              size="lg"
              className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold h-14 text-base"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" /> ADD TO CART
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-base"
              onClick={handleBuyNow}
            >
              <Zap className="w-5 h-5 mr-2" /> BUY NOW
            </Button>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Product Details --- */}
        <div className="lg:col-span-7">
          <div className="space-y-4">
            <p className="text-muted-foreground">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-600">{product.name}</h1>

            <div className="flex items-center gap-3">
              <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-2 py-0.5">
                <Star className="w-3.5 h-3.5 mr-1 fill-white" />
                {product.rating}
              </Badge>
              <p className="text-sm font-medium text-muted-foreground">
                {product.reviewCount.toLocaleString()} Reviews
              </p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-500">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-green-600">
                {product.discount}% off
              </span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-4">
              <span className="font-medium text-sm text-muted-foreground">
                Quantity:
              </span>
              <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
            </div>

            <div className="pt-4">
              <Card className="pt-4">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <span className="text-sm text-muted-foreground col-span-1">
                          {key}
                        </span>

                        <span className="text-sm col-span-2">{value}</span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
