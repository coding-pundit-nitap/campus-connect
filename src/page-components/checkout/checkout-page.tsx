import { CheckoutForm } from "@/components/checkout/checkout-form";
import { BackButton } from "@/components/shared/back-button";
import { BatchCountdownBanner } from "@/components/shops/batch/batch-countdown-banner";
import { cartService } from "@/services/cart/cart.service";

export default async function CheckoutPageComponent({
  cart_id,
}: {
  cart_id: string;
}) {
  const {
    item_total,
    delivery_fee,
    direct_delivery_fee,
    platform_fee,
    cart,
    shop_id,
    shop_opening,
    shop_closing,
    shop_accepting_orders,
    batch_slots,
    qr_image_key,
    upi_id,
  } = await cartService.getCartData(cart_id);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton label="Back to Cart" />
        <BatchCountdownBanner shopId={shop_id} />
      </div>

      <CheckoutForm
        cart_id={cart_id}
        shop_id={shop_id}
        shopOpening={shop_opening}
        shopClosing={shop_closing}
        shopAcceptingOrders={shop_accepting_orders}
        direct_delivery_fee={direct_delivery_fee}
        deliveryFee={delivery_fee}
        platformFee={platform_fee}
        itemTotal={item_total}
        items={cart.items}
        batchSlots={batch_slots}
        qr_image_key={qr_image_key}
        upi_id={upi_id}
      />
    </div>
  );
}
