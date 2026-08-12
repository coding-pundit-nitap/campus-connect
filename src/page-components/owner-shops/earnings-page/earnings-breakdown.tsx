"use client";

import { formatCurrency } from "@/lib/utils/currency";
import type { VendorEarningsResponse } from "@/services/vendor/vendor-api.service";

export function EarningsBreakdown({ data }: { data: VendorEarningsResponse }) {
  return (
    <section className="rounded-2xl border border-border/30 bg-card/45 p-5 shadow-md backdrop-blur-xl">
      <h2 className="font-heading text-base font-black text-foreground">
        Where it came from
      </h2>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium text-muted-foreground">Customers paid</dt>
          <dd className="font-bold tabular-nums text-foreground">
            {formatCurrency(data.customersPaid)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium text-muted-foreground">
            Platform fee{" "}
            <span className="text-muted-foreground/70">(paid by customer)</span>
          </dt>
          <dd className="font-bold tabular-nums text-muted-foreground">
            {formatCurrency(data.platformFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/30 pt-2.5">
          <dt className="font-bold text-foreground">You earned</dt>
          <dd className="text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.vendorEarnings)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        The platform fee is added to the customer&apos;s bill. It is not taken
        out of your earnings.
      </p>
    </section>
  );
}
