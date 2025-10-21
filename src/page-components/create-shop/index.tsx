import { CreateShopForm } from "@/components/create-shop/create-shop-form";

export default function CreateShop() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create Your Shop</h1>
      <CreateShopForm />
    </div>
  );
}
