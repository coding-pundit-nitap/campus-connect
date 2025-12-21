"use client";

import { User } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdministratorInfoCardProps {
  user: User;
}

export function AdministratorInfoCard({ user }: AdministratorInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator Information</CardTitle>
        <CardDescription>Your admin account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <Badge>ADMIN</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="font-mono text-xs">{user.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
