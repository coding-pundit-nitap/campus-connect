import { CreditCard, Home, Phone, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { getShopOrderByIdAction } from "@/actions/order/order-actions";
import { OrderStatusUpdater } from "@/components/owned-shop/order-page/order-status-updater";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageUtils } from "@/lib/utils-functions";

type Props = {
  params: Promise<{ order_id: string }>;
};

const DetailItem = ({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`flex items-start gap-3`}>
    <div className="text-muted-foreground mt-1">{icon}</div>
    <div className={`flex flex-col w-full`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${className}`}>{children}</span>
    </div>
  </div>
);

export default async function ShopOrderDetailPage({ params }: Props) {
  const { order_id } = await params;
  const response = await getShopOrderByIdAction(order_id);

  if (!response.success || !response.data) {
    return notFound();
  }

  const order = response.data;
  const subtotal = order.items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.display_id}
          </h1>
          <p className="text-muted-foreground">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge
          variant={order.order_status === "COMPLETED" ? "default" : "secondary"}
          className="text-sm py-1 px-3"
        >
          {order.order_status.replaceAll(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Products Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] hidden md:table-cell">
                      Image
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="hidden md:table-cell">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          {item.product.imageKey ? (
                            <Image
                              src={ImageUtils.getImageUrl(
                                item.product.imageKey
                              )}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.product.description}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        x{item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{Number(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>
                Change the current state of the order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusUpdater
                orderId={order.id}
                currentStatus={order.order_status}
              />
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailItem icon={<User size={18} />} label="Customer">
                {order.user.name}
              </DetailItem>
              <DetailItem
                icon={<Phone size={18} />}
                className="flex justify-between"
                label="Customer"
              >
                {order.user.phone}
                <Link
                  href={`tel:+91${order.user.phone}`}
                  className="text-blue-500 hover:underline"
                >
                  <Phone size={16} />
                </Link>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/91${order.user.phone}`}
                  className="text-blue-500 hover:underline"
                >
                  <Image
                    src="/svg/whatsapp-icon.svg"
                    alt="WhatsApp"
                    width={18}
                    height={18}
                  />
                </Link>
              </DetailItem>
              <DetailItem icon={<Home size={18} />} label="Delivery Address">
                {order.delivery_address_snapshot}
              </DetailItem>
              <DetailItem
                icon={<CreditCard size={18} />}
                label="Payment Method"
              >
                <Badge variant="outline" className="capitalize">
                  {order.payment_method.toLowerCase()}
                </Badge>
              </DetailItem>
            </CardContent>
            <Separator />
            <CardContent className="p-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>₹0.00</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{Number(order.total_price).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
