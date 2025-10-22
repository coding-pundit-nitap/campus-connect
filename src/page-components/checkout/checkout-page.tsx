"use client";

import { UserAddress as UserAddressType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CheckoutHeader,
  OrderSummary,
  UserAddress,
} from "@/components/checkout";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useCartDrawer } from "@/hooks";

export default function CheckoutPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const router = useRouter();
  const { summary } = useCartDrawer();
  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] = useState<Date>();

  const handleSelectTime = (date: Date) => {
    setRequestedDeliveryTime(date);
  };

  const handleAddressSelect = (address: UserAddressType) => {
    setSelectedAddress(address);
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!requestedDeliveryTime) {
      toast.error("Please select a delivery time");
      return;
    }

    const checkoutData = {
      cart_id,
      delivery_address_id: selectedAddress.id,
      requested_delivery_time: requestedDeliveryTime.toISOString(),
    };
    sessionStorage.setItem("checkout_data", JSON.stringify(checkoutData));

    router.push(`/checkout/${cart_id}/payment`);
  };

  const items = useMemo(
    () => summary?.shopCarts.find((cart) => cart.id === cart_id)?.items || [],
    [summary, cart_id]
  );

  const total = items.reduce(
    (sum, item) =>
      sum + ((item.price * (100 - item.discount)) / 100) * item.quantity,
    0
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

        <Card>
          <CardHeader>
            <CardTitle>Delivery Time</CardTitle>
          </CardHeader>
          <CardContent>
            <DateTimePicker handleOnDateChange={handleSelectTime} />
            {requestedDeliveryTime && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {requestedDeliveryTime.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <OrderSummary items={items} />

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedAddress || !requestedDeliveryTime}
              className="w-full"
              size="lg"
            >
              Proceed to Payment - ₹{total.toFixed(2)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SharedCard>
  );
}
