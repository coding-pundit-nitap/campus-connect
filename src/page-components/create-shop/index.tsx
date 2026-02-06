import { CreateShopForm } from "@/components/create-shop/create-shop-form";

export default function CreateShop() {
  return (
    <div className="container mx-auto py-10 space-y-2">
      <h1 className="text-3xl font-bold">Create your shop</h1>
      <p className="text-muted-foreground">
        Set your fees and batch cards (or run direct delivery).
      </p>
      <CreateShopForm />
    </div>
  );
}
