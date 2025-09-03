import React from "react";

type Props = {
  shop_id: string;
};

export default function IndividualShop({ shop_id }: Props) {
  return <div>Individual Shop: {shop_id}</div>;
}
