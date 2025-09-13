"use client";
import { QRCodeCanvas } from "qrcode.react";
import React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export default function QrPayment() {
  return (
    <div className="flex mt-16">
      {/* Card will take left half */}
      <div className="w-1/2 flex justify-center">
        <Card className="w-100 h-92">
          <CardHeader>
            <CardTitle className="mt-5 text-center">QR Code</CardTitle>
            <CardDescription>Scan it to pay</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCodeCanvas
              value="upi://pay?pa=yourupi@bank&pn=YourName&am=100&cu=INR"
              size={180}
              level={"H"}
              // includeMargin={true}
              marginSize={3}
            />
          </CardContent>
          <CardFooter className="ml-30">
            <p>yourUPIid@yxl</p>
          </CardFooter>
        </Card>
      </div>

      {/* Right half is empty for now */}
      <div className="w-1/2 ml-20">
        You can add UPI ID or something else here later if required
      </div>
    </div>
  );
}
