import { BackButton } from "@/components/shared/back-button";
import IndividualProduct from "@/components/shops/individual-product";

type Props = {
  product_id: string;
};

export default function IndividualProductPage({ product_id }: Props) {
  return (
    <div className="container py-6 space-y-4">
      <BackButton label="Back" />
      <IndividualProduct product_id={product_id} />
    </div>
  );
}
