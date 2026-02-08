import { CheckoutHeader } from "@/components/checkout";
import { PaymentForm } from "@/components/checkout/payment-form";
import { SharedCard } from "@/components/shared/shared-card";
import { cartService } from "@/services/cart/cart.service";

export default async function PaymentPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const {
    cart,
    shop_id,
    qr_image_key,
    upi_id,
    item_total,
    delivery_fee,
    direct_delivery_fee,
    platform_fee,
  } = await cartService.getCartData(cart_id);

  return (
    <SharedCard
      headerContent={<CheckoutHeader currentStep="payment" />}
      contentClassName="grid lg:grid-cols-2 gap-8 px-0"
    >
      <PaymentForm
        cart_id={cart_id}
        qr_image_key={qr_image_key}
        shop_id={shop_id}
        upi_id={upi_id}
        item_total={item_total}
        delivery_fee={delivery_fee}
        direct_delivery_fee={direct_delivery_fee}
        platform_fee={platform_fee}
        items={cart.items}
      />
    </SharedCard>
  );
}
