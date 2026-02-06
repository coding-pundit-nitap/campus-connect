import { BatchCardsManager } from "@/components/owned-shop/batch-cards/batch-cards-manager";

export default function OwnerBatchCardsPage() {
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Batch cards</h1>
        <p className="text-muted-foreground">
          Configure your delivery schedule. Empty = direct delivery only.
        </p>
      </div>
      <BatchCardsManager />
    </div>
  );
}
