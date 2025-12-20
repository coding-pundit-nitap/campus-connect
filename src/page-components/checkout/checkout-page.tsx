import { CheckoutHeader, OrderSummary } from "@/components/checkout";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { BackButton } from "@/components/shared/back-button";
import { SharedCard } from "@/components/shared/shared-card";
import { cartService } from "@/services/cart/cart.service";

export default async function CheckoutPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const { total, cart, shop_opening, shop_closing } =
    await cartService.getCartData(cart_id);
  return (
    <div className="container py-6 space-y-4">
      <BackButton label="Back to Cart" />
      <SharedCard
        headerContent={<CheckoutHeader currentStep="address" />}
        contentClassName="grid lg:grid-cols-2 gap-8 px-0"
      >
        <CheckoutForm
          cart_id={cart_id}
          total={total}
          shopOpening={shop_opening}
          shopClosing={shop_closing}
        />

        <div className="space-y-6">
          <OrderSummary items={cart.items} total={total} />
        </div>
      </SharedCard>
    </div>
  );
}
