"use client";

import { addHours, format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Clock,
  Loader2,
  Megaphone,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useOwnerContext } from "@/components/owned-shop/owner-context";
import { BackButton } from "@/components/shared/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useShopAnnouncements,
} from "@/hooks/queries/useAnnouncements";
import { useShopProducts } from "@/hooks/queries/useShopProducts";

type FormValues = {
  title: string;
  message: string;
  durationHours: string;
  productId: string;
};

export default function OwnerAnnouncementsPage() {
  const { shop, isLoading: isShopLoading } = useOwnerContext();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const { data: announcements = [], isLoading: isAnnouncementsLoading } =
    useShopAnnouncements();
  const { mutate: createAnnouncement, isPending: isCreating } =
    useCreateAnnouncement();
  const { mutate: deleteAnnouncement, isPending: isDeleting } =
    useDeleteAnnouncement();

  const { data: productsData } = useShopProducts(shop?.id || "");
  const products = useMemo(() => {
    return productsData?.pages.flatMap((page) => page.data) || [];
  }, [productsData]);

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      message: "",
      durationHours: "6",
      productId: "NONE",
    },
  });

  const onSubmit = (values: FormValues) => {
    const hours = parseInt(values.durationHours, 10);
    const expiresAt = addHours(new Date(), hours);
    const productId =
      values.productId === "NONE" ? undefined : values.productId;

    createAnnouncement(
      {
        title: values.title,
        message: values.message,
        expires_at: expiresAt,
        product_id: productId,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setOpen(false);
            form.reset({
              title: "",
              message: "",
              durationHours: "6",
              productId: "NONE",
            });
          }
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncement(id);
    }
  };

  if (isShopLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-muted-foreground mt-4 font-bold">
          Loading shop settings...
        </p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Shop Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          We couldn't retrieve your shop information. Please set up your shop
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton
            href="/owner-shops"
            label="Back to Dashboard"
            className="rounded-xl border border-border/80 bg-card hover:bg-muted shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 px-3 py-1.5 h-auto font-semibold flex items-center gap-1 text-xs cursor-pointer"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow hover:scale-102 active:scale-98 border-none py-2 px-4 h-9 flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md border border-border/60 bg-card shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black font-heading">
                Create Announcement
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Announce canteens specials, roll discounts, or restocked items
                to all campus students.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-2"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-bold">
                        Announcement Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Practical Lab Manuals back in stock!"
                          className="rounded-xl h-10 text-xs font-semibold"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-bold">
                        Message Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide details about the deal, pricing, quantity available..."
                          className="rounded-xl min-h-24 text-xs font-medium leading-relaxed resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-bold">
                          Keep Active For
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem
                              value="1"
                              className="text-xs font-semibold"
                            >
                              1 Hour
                            </SelectItem>
                            <SelectItem
                              value="2"
                              className="text-xs font-semibold"
                            >
                              2 Hours
                            </SelectItem>
                            <SelectItem
                              value="6"
                              className="text-xs font-semibold"
                            >
                              6 Hours
                            </SelectItem>
                            <SelectItem
                              value="12"
                              className="text-xs font-semibold"
                            >
                              12 Hours
                            </SelectItem>
                            <SelectItem
                              value="24"
                              className="text-xs font-semibold"
                            >
                              24 Hours
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-bold">
                          Link Product (Optional)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl max-h-48">
                            <SelectItem
                              value="NONE"
                              className="text-xs font-semibold"
                            >
                              No Product
                            </SelectItem>
                            {products.map((prod) => (
                              <SelectItem
                                key={prod.id}
                                value={prod.id}
                                className="text-xs font-semibold"
                              >
                                {prod.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-2 flex flex-row gap-2 justify-end sm:space-x-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isCreating}
                    className="rounded-xl h-9 text-xs font-bold border-border/60 hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none shadow px-4 h-9 flex items-center justify-center"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Announcement"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-3xl border-2 border-border/85 bg-card/65 backdrop-blur-xl shadow-xl overflow-hidden relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] before:bg-gradient-to-r before:from-blue-600 before:to-orange-500 before:z-10">
        <CardHeader>
          <CardTitle className="text-xl font-black font-heading flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600 animate-pulse" />
            Announcement Manager
          </CardTitle>
          <CardDescription className="text-xs font-semibold">
            Manage your canteens specials, deals, or restock notices for{" "}
            {shop.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAnnouncementsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-2xl text-center bg-muted/20">
              <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-2.5" />
              <h4 className="text-xs font-bold text-foreground">
                No announcements published
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[250px] leading-relaxed font-semibold">
                Publish a new announcement to let students know about discounts,
                canteen rolls, or lab manuals!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20 border border-border/30 rounded-2xl bg-card overflow-hidden">
              {announcements.map((ann: any) => {
                const expiresAt = new Date(ann.expires_at);
                const isExpired = expiresAt.getTime() <= now;

                return (
                  <div
                    key={ann.id}
                    className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/10 transition-colors duration-150"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-foreground truncate block">
                          {ann.title}
                        </span>
                        <Badge
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            isExpired
                              ? "bg-red-500/10 border border-red-500/20 text-red-600"
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
                          }`}
                          variant="outline"
                        >
                          {isExpired ? "Expired" : "Active"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed wrap-break-word">
                        {ann.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        {ann.product_name && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <ShoppingBag className="h-3 w-3" />
                            Linked: {ann.product_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isExpired ? "Expired: " : "Expires: "}
                          {format(expiresAt, "MMM d, h:mm a")} (
                          {formatDistanceToNow(expiresAt, { addSuffix: true })})
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ann.id)}
                      disabled={isDeleting}
                      className="rounded-xl border border-border/80 bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 px-3 py-1.5 h-8 font-bold text-xs cursor-pointer flex items-center gap-1.5 self-end sm:self-auto shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
