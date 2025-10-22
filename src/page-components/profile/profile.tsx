"use client";

import { useSession } from "next-auth/react";

import { UserAddress } from "@/components/checkout";
import ProfileCard from "@/components/profile/profile-card";
// import SecuritySettings from "@/components/profile/security";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginIndicator from "@/components/wrapper/login-indicator";

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
          Manage your profile, security, and delivery addresses
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {/* <TabsTrigger value="security">Security</TabsTrigger> */}
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileCard user={session.data.user} />
        </TabsContent>
        {/* <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent> */}
        <TabsContent value="addresses" className="mt-6">
          <UserAddress />
        </TabsContent>
      </Tabs>
    </div>
  );
}
