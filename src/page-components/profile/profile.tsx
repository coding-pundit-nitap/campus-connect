"use client";

import { UserAddress } from "@/components/checkout";
import { FavoriteShopsTab } from "@/components/profile/favorite-shops-tab";
import { OrderStatsTab } from "@/components/profile/order-stats-tab";
import ProfileCard from "@/components/profile/profile-card";
import { SecurityTab } from "@/components/profile/security-tab";
import { StockWatchesTab } from "@/components/profile/stock-watches-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginIndicator from "@/components/wrapper/login-indicator";
import { useSession } from "@/lib/auth-client";

export default function ProfilePage() {
  const session = useSession();

  if (!session.data?.user) {
    return <LoginIndicator />;
  }
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, security, and preferences
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="watches">Watches</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileCard user={session.data.user} />
        </TabsContent>
        <TabsContent value="addresses" className="mt-6">
          <UserAddress />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrderStatsTab />
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          <FavoriteShopsTab />
        </TabsContent>
        <TabsContent value="watches" className="mt-6">
          <StockWatchesTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
