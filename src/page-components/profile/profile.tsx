"use client";
import { useSession } from "next-auth/react";

import { UserAddress } from "@/components/checkout";
import ProfileCard from "@/components/profile/profile-card";
import SecuritySettings from "@/components/profile/security"; // New component
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const session = useSession();

  if (!session.data?.user) {
    return <p>Please log in to view your profile.</p>;
  }
  const user = session.data.user;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {/* ProfileCard doesn't need to be in another card */}
          <ProfileCard user={user} />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <UserAddress />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {/* You can create this component for password changes */}
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
