"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Loader2,
  Mail,
  Pencil,
  Phone,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { useProfileImageUpload, useUpdateUser } from "@/hooks";
import { authClient } from "@/lib/auth-client";
import { ImageUtils } from "@/lib/utils";
import { updateUserSchema } from "@/validations/user.validation";

import UserAvatar from "../sidebar/user-avatar";

interface ProfileCardProps {
  user: User;
}

const isUploadedImage = (image: string | null | undefined): boolean => {
  if (!image) return false;
  return !image.startsWith("http://") && !image.startsWith("https://");
};

const getDisplayImageUrl = (
  image: string | null | undefined
): string | null => {
  if (!image) return null;
  if (isUploadedImage(image)) {
    return ImageUtils.getImageUrl(image);
  }
  return image;
};

const ProfileCard = ({ user }: ProfileCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentImage, setCurrentImage] = useState(user.image);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCurrentImage(user.image);
  }, [user, isEditing, form]);

  const { mutate: updateUserMutation, isPending } = useUpdateUser();
  const { mutateAsync: uploadProfileImage, isPending: isUploadingImage } =
    useProfileImageUpload();

  const onSubmit = (values: z.infer<typeof updateUserSchema>) => {
    updateUserMutation(values, {
      onSuccess: async () => {
        setIsEditing(false);
        await authClient.updateUser({ phone: values.phone, name: values.name });
        form.reset();
      },
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      const result = await uploadProfileImage(file);
      if (result.success && result.data) {
        await authClient.updateUser({ image: result.data.image_key });
        setCurrentImage(result.data.image_key);
      }
    } catch {
      toast.error("Image upload error");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const displayImageUrl = getDisplayImageUrl(currentImage);

  const headerContent = (
    <>
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="relative group">
          <UserAvatar
            image={displayImageUrl}
            name={user.name}
            dimention={140}
          />
          <button
            onClick={handleImageClick}
            disabled={isUploadingImage}
            className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90 disabled:opacity-50"
            title="Change profile picture"
          >
            {isUploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
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
