"use client";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * This file defines the shopping cart page component.
 * It displays a list of shops with items in the cart,
 */
const shops = [
  {
    id: "shop1",
    name: "RJ",
    items: [
      { id: "item1", name: "Pizza", price: 250, quantity: 2 },
      { id: "item2", name: "Burger", price: 49, quantity: 1 },
    ],
  },
  {
    id: "shop2",
    name: "Shaw",
    items: [
      { id: "item3", name: "Pizza", price: 10, quantity: 1 },
      { id: "item4", name: "Burger", price: 100, quantity: 1 },
    ],
  },
];

function ShopCart({ shop }: { shop: (typeof shops)[0] }) {
  const router = useRouter();
  const subtotal = shop.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shop.name}</CardTitle>
        <CardDescription>
          {shop.items.length} item{shop.items.length !== 1 ? "s" : ""} in your
          cart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shop.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b pb-4"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₹{item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          <div className="flex justify-between font-bold pt-2">
            <p>Subtotal</p>
            <p>₹{subtotal.toFixed(2)}</p>
          </div>
          <div></div>

          <Button
            className="w-full mt-4"
            onClick={() => router.push("/checkout")}
            disabled={shop.items.length === 0}
          >
            Checkout from {shop.name}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CartPage() {
  return (
    <Card className="p-6 w-full">
      <div className="space-y-6">
        <div>
          <ShoppingCart className="h-10 w-10 text-purple-500 animate-bounce" />
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground">
            Review your items and proceed to checkout
          </p>
        </div>

        {shops.length > 0 ? (
          <Tabs defaultValue={shops[0].id} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {shops.map((shop) => (
                <TabsTrigger key={shop.id} value={shop.id}>
                  {shop.name} ({shop.items.length})
                </TabsTrigger>
              ))}
            </TabsList>

            {shops.map((shop) => (
              <TabsContent key={shop.id} value={shop.id}>
                <ShopCart shop={shop} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-teal-500 animate-bounce" />
                Your cart is empty
              </CardTitle>
              <CardDescription>Add some items to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Browse our products and add items to your cart
                </p>
                <Button variant="outline">Continue Shopping</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* {shops.length > 0 && (
          <div className="flex justify-end">
            <Button size="lg" onClick={() => router.push("/checkout")}>
              Proceed to Full Checkout
            </Button>
          </div>
        )} */}

        <p className="text-muted-foreground">
          Thank you for shopping with us :)
        </p>
      </div>
    </Card>
  );
}
