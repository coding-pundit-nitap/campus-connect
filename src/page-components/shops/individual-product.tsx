import IndividualProductServer from "@/components/shops/individual-product";

type Props = {
  product_id: string;
};

export default function IndividualProduct({ product_id }: Props) {
  return <IndividualProductServer product_id={product_id} />;
}
