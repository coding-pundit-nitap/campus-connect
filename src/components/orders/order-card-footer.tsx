import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
};

export default function OrderCardFooter({ orderId }: Props) {
  return (
    <div className="pt-2">
      <Button
        asChild
        className="w-full rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98 shadow-xs border-2 border-transparent bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
      >
        <Link href={`/orders/${orderId}`}>Show Details</Link>
      </Button>
    </div>
  );
}
