import IndividualProduct from "@/components/shops/individual-product";

type Props = {
  product_id: string;
};

export default function IndividualProductPage({ product_id }: Props) {
  return <IndividualProduct product_id={product_id} />;
}
