import { Shield } from "lucide-react";
import React from "react";

export default function ShopOwnerBadge() {
  return (
    <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
      <Shield className="h-4 w-4 text-blue-600" />
      <span className="text-xs font-medium text-blue-600">Shop Owner</span>
    </div>
  );
}
