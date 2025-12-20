import { CheckoutHeader, OrderSummary } from "@/components/checkout";
import { PaymentForm } from "@/components/checkout/payment-form";
import { SharedCard } from "@/components/shared/shared-card";
import { cartService } from "@/services/cart/cart.service";

export default async function PaymentPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const { cart, total, shop_id, qr_image_key, upi_id } =
    await cartService.getCartData(cart_id);

  return (
    <SharedCard
      headerContent={<CheckoutHeader currentStep="payment" />}
      contentClassName="grid lg:grid-cols-2 gap-8 px-0"
    >
      <PaymentForm
        cart_id={cart_id}
        total={total}
        qr_image_key={qr_image_key}
        shop_id={shop_id}
        upi_id={upi_id}
      />
      <div className="space-y-6">
        <OrderSummary items={cart.items} total={total} />
      </div>
    </SharedCard>
  );
}
