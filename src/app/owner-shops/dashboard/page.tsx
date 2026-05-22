import { Metadata } from "next";

import { VendorDashboard } from "@/components/owned-shop/dashboard";

export const metadata: Metadata = {
  title: "Batch Dashboard | Vendor",
  description: "Manage your delivery batches and orders",
};

export default function VendorDashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <VendorDashboard />
    </div>
  );
}
