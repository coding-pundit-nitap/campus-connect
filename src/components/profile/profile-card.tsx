"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Pencil, Phone, User as UserIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { User } from "@/auth";
import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUpdateUser } from "@/hooks/queries/useUser";
import { authClient } from "@/lib/auth-client";
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
    updateUserMutation(values, {
      onSuccess: async () => {
        setIsEditing(false);
        await authClient.updateUser({ phone: values.phone, name: values.name });
        form.reset();
      },
    });
  };

  const headerContent = (
    <>
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="relative group">
          <UserAvatar image={user.image} name={user.name} dimention={140} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-3xl font-bold tracking-tight">{user.name}</p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <p className="text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );

  return (
    <SharedCard
      title="Personal Information"
      description="Update your personal details and profile picture"
      className="border-2"
      showHeader={true}
      headerContent={headerContent}
    >
      {/* Profile Form Section */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!isEditing ? (
            <div className="space-y-6">
              {/* Display Mode */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserIcon className="h-4 w-4" />
                    <FormLabel className="text-xs uppercase font-semibold">
                      Full Name
                    </FormLabel>
                  </div>
                  <p className="text-lg font-medium">{user.name}</p>
                </div>
                <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <FormLabel className="text-xs uppercase font-semibold">
                      Phone Number
                    </FormLabel>
                  </div>
                  <p className="text-lg font-medium">
                    {user.phone || (
                      <span className="text-muted-foreground italic">
                        Not provided
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsEditing(true)}
                size="lg"
                className="w-full md:w-auto"
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </div>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          className="h-11"
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="flex-1 md:flex-none"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  size="lg"
                  disabled={isPending}
                  className="flex-1 md:flex-none"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </SharedCard>
  );
};

export default ProfileCard;
