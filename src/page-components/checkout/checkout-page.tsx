import { CheckoutHeader } from "@/components/checkout";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { BackButton } from "@/components/shared/back-button";
import { SharedCard } from "@/components/shared/shared-card";
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
    batch_slots,
  } = await cartService.getCartData(cart_id);
  return (
    <div className="container py-6 space-y-4">
      <BackButton label="Back to Cart" />
      <BatchCountdownBanner shopId={shop_id} />
      <SharedCard
        headerContent={<CheckoutHeader currentStep="address" />}
        contentClassName="grid lg:grid-cols-2 gap-8 px-0"
      >
        <CheckoutForm
          cart_id={cart_id}
          shopOpening={shop_opening}
          shopClosing={shop_closing}
          direct_delivery_fee={direct_delivery_fee}
          deliveryFee={delivery_fee}
          platformFee={platform_fee}
          itemTotal={item_total}
          items={cart.items}
          batchSlots={batch_slots}
        />
      </SharedCard>
    </div>
  );
}
