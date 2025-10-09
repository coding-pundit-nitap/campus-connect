"use client";
import { useRouter } from "next/navigation";
import React from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSellerOrders } from "@/hooks";
export default function OwnerOrders() {
  const orders = [
    { id: "INV001", status: "Paid", method: "Credit Card", amount: "₹250.00" },
    { id: "INV002", status: "Pending", method: "UPI", amount: "₹180.00" },
    { id: "INV003", status: "Pending", method: "UPI", amount: "₹10980.00" },
    { id: "INV004", status: "Paid", method: "Cash", amount: "₹18000.00" },
    { id: "INV005", status: "Pending", method: "UPI", amount: "₹180.00" },
  ];
  const { data } = useSellerOrders();
  const router = useRouter();
  return (
    <Table>
      <TableCaption>A list of your recent orders.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="border-separate border-spacing-y-3 border-spacing-x-0">
        {orders.map((order) => (
          <TableRow
            key={order.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <TableCell className="font-medium px-4 py-3">{order.id}</TableCell>
            <TableCell className="px-4 py-3">{order.status}</TableCell>
            <TableCell className="px-4 py-3"> {order.method}</TableCell>
            <TableCell className="text-right px-4 py-3">
              {order.amount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
