import {
  Calendar,
  CreditCard,
  Hash,
  Home,
  Link2,
  Phone,
  User,
} from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { getShopOrderByIdAction } from "@/actions/orders/order-actions";
import { IndividualDeliveryCard } from "@/components/owned-shop/order-page/individual-delivery-card";
import { OrderStatusUpdater } from "@/components/owned-shop/order-page/order-status-updater";
import { BackButton } from "@/components/shared/back-button";
import { DateDisplay } from "@/components/shared/date-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ImageUtils } from "@/lib/utils";
import { OrderStatus } from "@/types/prisma.types";

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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <BackButton
        href="/owner-shops/orders"
        label="Back to Orders"
        className="mb-4"
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.display_id}
          </h1>
          <p className="text-muted-foreground">
            Placed on <DateDisplay date={order.created_at} />
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
                    <TableHead className="w-20 hidden md:table-cell">
                      Image
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="hidden md:table-cell">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          {item.product.image_key ? (
                            <Image
                              src={ImageUtils.getImageUrl(
                                item.product.image_key
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
                        <div
                          className="text-sm text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: item.product.description || "",
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        x{item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹
                        {(
                          item.price -
                          (item.price * (item.product.discount || 0)) / 100
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹
                        {(
                          (item.price -
                            (item.price * (item.product.discount || 0)) / 100) *
                          item.quantity
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/product/${item.product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            <Link2 size={16} />
                          </Link>
                        </Button>
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
                currentStatus={order.order_status as OrderStatus}
              />
            </CardContent>
          </Card>

          <IndividualDeliveryCard
            orderId={order.id}
            status={order.order_status as OrderStatus}
          />

          <Card className="py-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailItem icon={<User size={18} />} label="Customer">
                {order.user.name}
              </DetailItem>
              {order.user.phone && (
                <DetailItem
                  icon={<Phone size={18} />}
                  className="flex justify-between"
                  label="Customer"
                >
                  {order.user.phone}
                  <Link
                    href={`tel:+91${order.user.phone}` as Route}
                    className="text-blue-500 hover:underline"
                  >
                    <Phone size={16} />
                  </Link>
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/91${order.user.phone}` as Route}
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
              )}
              <DetailItem icon={<Home size={18} />} label="Delivery Address">
                {order.delivery_address_snapshot}
              </DetailItem>
              {order.requested_delivery_time && (
                <DetailItem
                  icon={<Calendar size={18} />}
                  label="Requested Delivery Time"
                >
                  <span className="text-orange-600 font-semibold">
                    <DateDisplay date={order.requested_delivery_time} />
                  </span>
                </DetailItem>
              )}
              <DetailItem
                icon={<CreditCard size={18} />}
                label="Payment Method"
              >
                <Badge variant="outline" className="capitalize">
                  {order.payment_method.toLowerCase()}
                </Badge>
              </DetailItem>
              {order.payment_method === "ONLINE" &&
                order.upi_transaction_id && (
                  <DetailItem
                    icon={<Hash size={18} />}
                    label="UPI Transaction ID"
                  >
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {order.upi_transaction_id}
                    </code>
                  </DetailItem>
                )}
              {order.customer_notes && (
                <DetailItem icon={<User size={18} />} label="Customer Notes">
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md italic">
                    "{order.customer_notes}"
                  </div>
                </DetailItem>
              )}
            </CardContent>
            <Separator />
            <CardContent className="p-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Item Total</span>
                <span>₹{order.item_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>₹{order.delivery_fee.toFixed(2)}</span>
              </div>
              {order.platform_fee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee</span>
                  <span>₹{order.platform_fee.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{order.total_price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
