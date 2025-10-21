"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { User } from "next-auth";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateUser } from "@/hooks/tanstack/useUser";
import { updateUserSchema } from "@/validations/user.validation";

import UserAvatar from "../sidebar/user-avatar";

interface ProfileCardProps {
  user: User;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name ?? "",
      phone: user.phone ?? "",
    });
  }, [user, isEditing, form]);

  const { mutate: updateUserMutation, isPending } = useUpdateUser();

  const onSubmit = (values: z.infer<typeof updateUserSchema>) => {
    updateUserMutation(values);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <UserAvatar image={user.image} name={user.name} dimention={40} />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm">Change Photo</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{user.name}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <FormLabel>Name</FormLabel>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  <div>
                    <FormLabel>Phone</FormLabel>
                    <p className="text-lg">{user.phone || "Not provided"}</p>
                  </div>
                  <Button onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default ProfileCard;
