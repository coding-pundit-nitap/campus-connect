import { redirect } from "next/navigation";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ cart_id: string }>;
}) {
  const { cart_id } = await params;
  redirect(`/checkout/${cart_id}`);
}
