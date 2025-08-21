"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  shippingMethod: "express" | "overnight";
}

const mockCartItems: CartItem[] = [
  {
    id: "1",
    name: "Pizza",
    price: 299,
    quantity: 1,
    image: "pizza.jpg",
  },
  {
    id: "2",
    name: "Burger",
    price: 49,
    quantity: 1,
    image: "burger.jpg",
  },
  {
    id: "3",
    name: "Tel",
    price: 99,
    quantity: 2,
    image: "tel.jpg",
  },
  {
    id: "4",
    name: "Chatai",
    price: 499,
    quantity: 1,
    image: "chatai.jpg",
  },
];

const shippingOptions = [
  {
    id: "express",
    name: "Express Shipping",
    price: 50,
    time: "1-2 hours",
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    price: 0,
    time: "1 day",
  },
];

export default function CheckoutPage() {
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    shippingMethod: "overnight",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = mockCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const selectedShipping = shippingOptions.find(
    (option) => option.id === formData.shippingMethod
  );
  const shippingCost = selectedShipping?.price || 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setNotification({
      message:
        "Order placed successfully! You will receive a confirmation email shortly.",
      type: "success",
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-lg leading-none hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-2">
        <div className="mb-8 border border-gray-300 p-4 rounded-lg">
          <ShoppingCart className="h-10 w-10 text-green-500 animate-bounce" />
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your purchase</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label htmlFor="email" className="m-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    className="border-gray-500"
                    type="email"
                    placeholder="xyz@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="m-2">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      className="border-gray-500"
                      placeholder="XYZ"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="m-2">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      className="border-gray-500"
                      placeholder="xyz"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="m-2">
                    Address
                  </Label>
                  <Input
                    id="address"
                    className="border-gray-500"
                    placeholder="Hostel Name"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Options</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.shippingMethod}
                  onValueChange={(value) =>
                    handleInputChange("shippingMethod", value)
                  }
                >
                  {shippingOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-3 border-2 border-gray-400 rounded-lg"
                    >
                      <RadioGroupItem
                        className="border-2 border-gray-500"
                        value={option.id}
                        id={option.id}
                      />
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="font-medium">
                          {option.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {option.time}
                        </p>
                      </div>
                      <span className="font-medium">₹{option.price}</span>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Details */}
                <div className="space-y-4">
                  {mockCartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping ({selectedShipping?.name})</span>
                    <span>₹{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated delivery</span>
                    <span>{selectedShipping?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing
                    ? "Processing..."
                    : `Place Order - ₹${total.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
