import { CheckoutHeader, OrderSummary } from "@/components/checkout";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SharedCard } from "@/components/shared/shared-card";
import { cartService } from "@/services/cart/cart.service";
export default async function CheckoutPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const { total, cart } = await cartService.getCartData(cart_id);
  return (
    <SharedCard
      headerContent={<CheckoutHeader />}
      contentClassName="grid lg:grid-cols-2 gap-8 px-0"
    >
      <CheckoutForm cart_id={cart_id} total={total} />

      <div className="space-y-6">
        <OrderSummary items={cart.items} total={total} />
      </div>
    </SharedCard>
  );
}
