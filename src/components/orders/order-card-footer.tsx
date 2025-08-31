import Link from "next/link";
import React from "react";

import { Button } from "../ui/button";

type Props = {
  orderId: string;
};

export default function OrderCardFooter({ orderId }: Props) {
  return (
    <div className="pt-2">
      <Button asChild className="w-full">
        <Link href={`/orders/${orderId}`}>Show Details</Link>
      </Button>
    </div>
  );
}
