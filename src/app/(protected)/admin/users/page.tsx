import { Shield, ShieldAlert, UserCheck, UserMinus, Users } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { getAllUsersAction, getUserStatsAction } from "@/actions/admin";
import { UsersTable } from "@/components/admin/users/users-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role } from "@/types/prisma.types";

export const metadata: Metadata = {
  title: "User Management | Admin Dashboard",
  description: "Manage user accounts and permissions",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; search?: string; role?: string }>;
}) {
  const { cursor, search, role } = await searchParams;

  let users = null;
  let stats = null;
  let error = null;

  try {
    const [usersRes, statsRes] = await Promise.all([
      getAllUsersAction({
        cursor,
        search,
        role: role as Role | undefined,
        limit: 20,
      }).then((res) => ({
        ...res,
        data: {
          ...res.data,
          data: res.data.data.map((user) => ({
            ...user,
            role: user.role as Role,
          })),
        },
      })),
      getUserStatsAction(),
    ]);

    if (usersRes.success) users = usersRes.data;
    else error = usersRes.details;

    if (statsRes.success) stats = statsRes.data;
  } catch {
    error = "Failed to load users";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and admin permissions
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Users</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentUsers} new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Users
              </CardTitle>
              <UserMinus className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-500">
                {stats.inactiveUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Not active recently
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Administrators
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalAdmins}
              </div>
              <p className="text-xs text-muted-foreground">With admin access</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Regular Users
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalRegularUsers}
              </div>
              <p className="text-xs text-muted-foreground">Standard accounts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {users && (
        <UsersTable initialData={users} searchParams={await searchParams} />
      )}
    </div>
  );
}
