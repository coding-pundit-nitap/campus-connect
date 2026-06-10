"use client";

import {
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Image as ImageIcon,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BatchCardsEditor } from "@/components/shared/batch-cards-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLinkShop } from "@/hooks";
import { cn } from "@/lib/cn";

import { SharedFileInput } from "../shared/shared-file-input";
import { RichTextEditor } from "../ui/rich-text-editor";

const STEPS_META = [
  { num: 1, title: "Shop Details", desc: "Name and description", icon: Store },
  {
    num: 2,
    title: "Hours & Location",
    desc: "Where and when you operate",
    icon: Clock,
  },
  {
    num: 3,
    title: "Fees & Batches",
    desc: "Pricing and delivery schedule",
    icon: Coins,
  },
  { num: 4, title: "Shop Image", desc: "Visual branding", icon: ImageIcon },
  {
    num: 5,
    title: "Payments",
    desc: "UPI and QR code setup",
    icon: CreditCard,
  },
];

const STEP_ESTIMATES = {
  1: "Step 1 of 5 • About 3 minutes left",
  2: "Step 2 of 5 • About 2 minutes left",
  3: "Step 3 of 5 • About 1 minute left",
  4: "Step 4 of 5 • Almost finished!",
  5: "Step 5 of 5 • Ready to launch!",
};

const SCHEMA_VERSION = 1;
const DRAFT_TTL = 72 * 60 * 60 * 1000; // 72 Hours

const serializableDraftSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  opening: z.string(),
  closing: z.string(),
  min_order_value: z.number().min(0),
  default_delivery_fee: z.number().min(0),
  direct_delivery_fee: z.number().min(0),
  upi_id: z.string(),
  batch_slots: z.array(
    z.object({
      cutoff_time_minutes: z.number().int().min(0).max(1439),
      label: z.string().nullable().optional(),
    })
  ),
});

const draftEnvelopeSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  savedAt: z
    .number()
    .refine((ts) => Date.now() - ts <= DRAFT_TTL, "Draft expired"),
  step: z.number().int().min(1).max(5),
  data: serializableDraftSchema,
});

type SerializableDraft = z.infer<typeof serializableDraftSchema>;
type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;

function validateDraft(envelope: unknown): envelope is DraftEnvelope {
  return draftEnvelopeSchema.safeParse(envelope).success;
}

export function CreateShopForm() {
  const [step, setStep] = useState(1);
  const { form, handlers, state } = useLinkShop();
  const { isSubmitting, isLoading } = state;

  const [pendingDraft, setPendingDraft] = useState<DraftEnvelope | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cc_create_shop_draft");
      if (raw) {
        const envelope = JSON.parse(raw);
        if (validateDraft(envelope)) {
          setTimeout(() => {
            setPendingDraft(envelope);
            setShowPrompt(true);
          }, 0);
        } else {
          sessionStorage.removeItem("cc_create_shop_draft");
        }
      }
    } catch {
      toast.error("Failed to parse draft from sessionStorage");
    }
  }, []);

  const handleRestore = () => {
    if (pendingDraft) {
      const { step: savedStep, data } = pendingDraft;
      setStep(savedStep);
      form.reset({
        name: data.name,
        description: data.description,
        location: data.location,
        opening: data.opening,
        closing: data.closing,
        min_order_value: data.min_order_value,
        default_delivery_fee: data.default_delivery_fee,
        direct_delivery_fee: data.direct_delivery_fee,
        upi_id: data.upi_id,
        batch_slots: data.batch_slots,
      });
    }
    setShowPrompt(false);
  };

  const handleDiscard = () => {
    sessionStorage.removeItem("cc_create_shop_draft");
    setShowPrompt(false);
  };

  const stepFieldNames = {
    1: ["name", "description"] as const,
    2: ["location", "opening", "closing"] as const,
    3: [
      "min_order_value",
      "default_delivery_fee",
      "direct_delivery_fee",
      "batch_slots",
    ] as const,
    4: ["image"] as const,
    5: ["qr_image", "upi_id"] as const,
  };

  const nextStep = async () => {
    const fieldNames = stepFieldNames[step as keyof typeof stepFieldNames];
    const isValid = await form.trigger(fieldNames);
    if (isValid) setStep((s) => s + 1);
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      const timer = setTimeout(() => {
        try {
          const serializableValues: SerializableDraft = {
            name: values.name || "",
            description: values.description || "",
            location: values.location || "",
            opening: values.opening || "07:00",
            closing: values.closing || "20:00",
            min_order_value: Number(values.min_order_value) || 50,
            default_delivery_fee: Number(values.default_delivery_fee) || 0,
            direct_delivery_fee: Number(values.direct_delivery_fee) || 0,
            upi_id: values.upi_id || "",
            batch_slots: (
              (values.batch_slots || []) as {
                cutoff_time_minutes?: number;
                label?: string | null;
              }[]
            ).map((slot) => ({
              cutoff_time_minutes: Number(slot?.cutoff_time_minutes) || 0,
              label: slot?.label || null,
            })),
          };

          const envelope: DraftEnvelope = {
            version: SCHEMA_VERSION,
            savedAt: Date.now(),
            step,
            data: serializableValues,
          };

          sessionStorage.setItem(
            "cc_create_shop_draft",
            JSON.stringify(envelope)
          );
        } catch {
          toast.error("Failed to save draft");
        }
      }, 500);
      return () => clearTimeout(timer);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, step]);

  const activeMeta = STEPS_META[step - 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-12 py-8 px-4 sm:px-6">
      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent className="max-w-md bg-card border border-border/30 rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
              Resume previous setup?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              We found an unfinished draft for your shop setup. Would you like
              to resume where you left off or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-border/10 pt-3">
            <AlertDialogCancel
              onClick={handleDiscard}
              className="h-10 px-5 rounded-xl border-border/60 font-semibold cursor-pointer"
            >
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="h-10 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-orange-500 hover:opacity-90 text-white cursor-pointer border-none shadow shadow-orange-500/10"
            >
              Resume Setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-8">
        <div className="sticky top-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black font-heading tracking-tight text-foreground">
              Create Shop
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
              Set up your store and delivery details in 5 simple steps.
            </p>
          </div>

          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
              <span>Progress</span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <Progress
              value={(step / 5) * 100}
              className="h-1.5 bg-muted rounded-full [&_div]:bg-gradient-to-r [&_div]:from-blue-600 [&_div]:to-orange-500"
            />
            <p className="text-[10px] text-muted-foreground/80 font-medium mt-1">
              {STEP_ESTIMATES[step as keyof typeof STEP_ESTIMATES]}
            </p>
          </div>

          <nav className="relative flex flex-col gap-6 pl-2">
            <div className="absolute left-4.5 top-2 bottom-2 w-[1.5px] bg-border/40 pointer-events-none" />

            {STEPS_META.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              const StepIcon = s.icon;

              return (
                <div
                  key={s.num}
                  className={cn(
                    "relative flex items-start gap-4 transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "z-10 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-300",
                      isCompleted
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : isActive
                          ? "border-orange-500 bg-orange-500/10 text-orange-500 scale-110 shadow-lg shadow-orange-500/[0.08]"
                          : "border-border/60 bg-muted/20 text-muted-foreground/60"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-xs font-semibold leading-tight transition-colors duration-200",
                        isActive
                          ? "text-foreground font-bold"
                          : "text-muted-foreground"
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {s.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="md:hidden col-span-12 space-y-3 mb-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
            {activeMeta.title}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            {STEP_ESTIMATES[step as keyof typeof STEP_ESTIMATES]}
          </span>
        </div>
        <Progress
          value={(step / 5) * 100}
          className="h-1.5 bg-muted rounded-full [&_div]:bg-gradient-to-r [&_div]:from-blue-600 [&_div]:to-orange-500"
        />
      </div>

      <div className="md:col-span-8 lg:col-span-9 col-span-12">
        <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl shadow-blue-500/[0.01] overflow-hidden relative flex flex-col h-full min-h-[500px]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
          <Form {...form}>
            <form
              onSubmit={handlers.onSubmit}
              className="flex flex-col h-full min-h-[500px] justify-between"
            >
              <div className="p-6 sm:p-8 flex-1 space-y-6">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Shop Details
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Identify your shop so customers can locate you easily.
                      </p>
                    </div>
                    <Separator className="bg-border/40" />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Shop Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="E.g., Midnight Munchies, Block A Canteen"
                                className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              Your shop's public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Description
                            </FormLabel>
                            <FormControl>
                              <div className="focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 rounded-xl overflow-hidden border border-border/50 transition-all duration-300">
                                <RichTextEditor
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="Write details about your menu, specialties, or standard canteen hours..."
                                  disabled={field.disabled || isSubmitting}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80 flex justify-between">
                              <span>
                                Describe what you sell to campus students.
                              </span>
                              <span>
                                {String(field.value || "").length}/500 chars
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Hours & Location
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Help campus students know when you are open and where to
                        pick up orders.
                      </p>
                    </div>
                    <Separator className="bg-border/40" />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Location / Pickup Point
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="E.g., Block A ground floor common room, Main Street"
                                className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              Specific description of your physical location on
                              campus.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="opening"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Opening Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-[10px] text-muted-foreground font-semibold">
                                E.g., 07:00 AM
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="closing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Closing Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-[10px] text-muted-foreground font-semibold">
                                E.g., 08:00 PM
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Fees & Schedule
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Configure minimum baskets, standard delivery rates, and
                        schedules.
                      </p>
                    </div>
                    <Separator className="bg-border/40" />
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="min_order_value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Minimum Order Value (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                                  value={field.value ?? 50}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.currentTarget.valueAsNumber
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription className="text-[11px] text-muted-foreground/80">
                                Minimum cart total required (E.g., ₹50).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="default_delivery_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Batch Delivery Fee (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const value = e.currentTarget.valueAsNumber;
                                    field.onChange(isNaN(value) ? 0 : value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="text-[11px] text-muted-foreground/80">
                                Delivery charge when using batched slots (E.g.,
                                ₹10).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="direct_delivery_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Direct Delivery Fee (₹)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="1"
                                className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                                value={field.value ?? 0}
                                onChange={(e) => {
                                  const value = e.currentTarget.valueAsNumber;
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              Additional charge for immediate, non-batched
                              delivery (E.g., ₹20).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="batch_slots"
                        render={({ field }) => (
                          <FormItem className="pt-2">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Delivery Batch Schedule
                            </FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground/80 mb-2">
                              Configure specific batch intervals. Leave empty if
                              you only run direct delivery.
                            </FormDescription>
                            <FormControl>
                              <div className="rounded-xl border border-border/30 p-4 bg-muted/20 shadow-inner">
                                <BatchCardsEditor
                                  value={field.value || []}
                                  onChange={field.onChange}
                                  disabled={isSubmitting || isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Shop Image
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Upload a banner logo or store graphic to brand your
                        portal.
                      </p>
                    </div>
                    <Separator className="bg-border/40" />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SharedFileInput
                                value={field.value}
                                onChange={(file) => field.onChange(file)}
                                accept="image/*"
                                maxSize={5}
                                placeholder="Drag & drop or click to upload brand image"
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              Upload high resolution JPG, PNG up to 5MB.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Payments Setup
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Provide your billing info so campus students can pay you
                        online.
                      </p>
                    </div>
                    <Separator className="bg-border/40" />
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="upi_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              UPI ID
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider placeholder:text-muted-foreground/40 font-semibold"
                                placeholder="e.g. merchant@ybl, canteenname@okaxis"
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              The exact UPI address where online customer
                              payments are routed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="qr_image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Billing QR Code
                            </FormLabel>
                            <FormControl>
                              <SharedFileInput
                                value={field.value}
                                onChange={(file) => field.onChange(file)}
                                accept="image/*"
                                maxSize={5}
                                placeholder="Upload your UPI QR code image"
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-muted-foreground/80">
                              Upload a screenshot of your UPI QR code for visual
                              scan pay validation.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8 bg-muted/10 border-t border-border/20 flex items-center justify-between mt-auto">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="h-11 px-6 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-4">
                  <FormMessage className="text-xs" />

                  {step < 5 && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white text-xs shadow shadow-blue-500/10 cursor-pointer border-none"
                    >
                      Continue
                    </Button>
                  )}
                  {step === 5 && (
                    <div className="flex flex-col items-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-[1.01] active:scale-[0.98] text-white shadow-lg shadow-orange-500/25 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer text-xs"
                      >
                        {isSubmitting || isLoading
                          ? "Launching portal..."
                          : "Create Shop & Launch Dashboard"}
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1.5 text-right font-medium">
                        Your store goes live after setup.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
