"use client";

import { UserAddress as UserAddressType } from "@prisma/client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CheckoutHeader,
  OrderSummary,
  UserAddress,
} from "@/components/checkout";
import { SharedCard } from "@/components/shared/shared-card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCartDrawer, useCreateOrder } from "@/hooks";

export default function CheckoutPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const { summary } = useCartDrawer();
  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] = useState<Date>();
  const handleSelectTime = (date: Date) => {
    setRequestedDeliveryTime(date);
  };

  const { mutateAsync: createOrder } = useCreateOrder();

  const handleAddressSelect = (address: UserAddressType) => {
    setSelectedAddress(address);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    } else {
      toast.success("Order placed successfully!");
    }

    const cart = summary?.shopCarts.find((cart) => cart.id === cart_id);

    if (!cart || cart.items.length === 0) {
      toast.error("Cart not found or empty");
      return;
    }

    const shop_id = cart.items[0].shop_id;
    try {
      await createOrder({
        shop_id,
        payment_method: "CASH",
        delivery_address_id: selectedAddress.id,
        requested_delivery_time: requestedDeliveryTime,
      });
    } catch {
      toast.error("Failed to place order");
    }
  };

  const items = useMemo(
    () => summary?.shopCarts.find((cart) => cart.id === cart_id)?.items || [],
    [summary, cart_id]
  );

  return (
    <SharedCard
      headerContent={<CheckoutHeader />}
      contentClassName="grid lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <UserAddress
          selectedAddressId={selectedAddress?.id || null}
          onAddressSelect={handleAddressSelect}
        />
      </div>
      <div className="space-y-6">
        <OrderSummary
          items={items}
          onPlaceOrder={handlePlaceOrder}
          isProcessing={false}
        />
      </div>
      <div>
        <DateTimePicker handleOnDateChange={handleSelectTime} />
      </div>
    </SharedCard>
  );
}
