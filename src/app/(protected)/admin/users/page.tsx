import { Role } from "@prisma/client";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAllUsersAction } from "@/actions/admin";
import { auth } from "@/auth";
import { UsersTable } from "@/components/admin/users/users-table";

export const metadata: Metadata = {
  title: "User Management | Admin Dashboard",
  description: "Manage user accounts and permissions",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; search?: string; role?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/?error=unauthorized");
  }

  const { cursor, search, role } = await searchParams;

  let users = null;
  let error = null;

  try {
    const response = await getAllUsersAction({
      cursor,
      search,
      role: role as Role | undefined,
      limit: 20,
    });

    if (response.success) {
      users = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load users";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and admin permissions
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {users && (
        <UsersTable initialData={users} searchParams={await searchParams} />
      )}
    </div>
  );
}
