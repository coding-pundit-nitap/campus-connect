"use client";

import { debounce } from "lodash";
import { Search } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useBuildings,
  usePublicShopDeliveryBuildings,
} from "@/hooks/queries/useBuildings";
import { cn } from "@/lib/cn";
import { AddressFormData } from "@/validations/user-address-schema";

interface UserAddressFormProps {
  form: UseFormReturn<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  shopId?: string;
}

export function UserAddressForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  shopId,
}: UserAddressFormProps) {
  const { data: allBuildings = [] } = useBuildings();

  const { data: allowedBuildings = [] } = usePublicShopDeliveryBuildings(
    shopId || ""
  );

  const [inputValue, setInputValue] = useState(
    form.getValues("building")
      ? form.getValues("building") +
          (form.getValues("hostel_block")
            ? ` (${form.getValues("hostel_block")})`
            : "")
      : ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSetQuery = useMemo(
    () =>
      debounce((val: string) => {
        setSearchQuery(val);
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  const searchableBuildings =
    allowedBuildings.length > 0 ? allowedBuildings : allBuildings;

  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchableBuildings.slice(0, 5);
    }
    const query = searchQuery.toLowerCase();
    return searchableBuildings.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.hostel_block && b.hostel_block.toLowerCase().includes(query))
    );
  }, [searchQuery, searchableBuildings]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    debouncedSetQuery(val);

    // Clear building_id since we are typing fresh custom text
    form.setValue("building_id", "");

    // Clear building name to trigger validation unless a match is chosen/typed
    // if delivery zone restrictions exist.
    if (allowedBuildings.length > 0) {
      form.setValue("building", "");
    } else {
      // If shop has no restrictions, allow user to save whatever they type
      form.setValue("building", val);
    }
  };

  const handleSelectBuilding = (building: {
    id: string;
    name: string;
    hostel_block: string | null;
  }) => {
    form.setValue("building_id", building.id);
    form.setValue("building", building.name);
    form.setValue("hostel_block", building.hostel_block || "");

    setInputValue(
      building.name +
        (building.hostel_block ? ` (${building.hostel_block})` : "")
    );
    setIsOpen(false);
  };

  return (
    <Card className="p-6 bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-blue-500/[0.02] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <div className="mb-6">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          Add New Address
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          Add a new delivery address to your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Address Label
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Home, Dorm, Office"
                    {...field}
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                  />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building_id"
            render={() => (
              <FormItem className="relative" ref={dropdownRef}>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>Building / Hostel Address</span>
                  {allowedBuildings.length > 0 && (
                    <span className="text-[10px] text-blue-600 tracking-tight lowercase font-medium">
                      Shop delivery limits active
                    </span>
                  )}
                </FormLabel>

                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Type your hostel or building name..."
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={() => setIsOpen(true)}
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium pr-10"
                    />
                  </FormControl>
                  <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />

                  {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border/30 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {filteredBuildings.length > 0 ? (
                        <>
                          <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Suggested Buildings
                          </div>
                          {filteredBuildings.map((building) => (
                            <button
                              key={building.id}
                              type="button"
                              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/80 flex justify-between items-center transition-colors focus:bg-muted/80 focus:outline-none"
                              onClick={() => handleSelectBuilding(building)}
                            >
                              <span className="font-semibold text-foreground/80">
                                {building.name}
                              </span>
                              {building.hostel_block && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                                  {building.hostel_block}
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-3 text-xs text-rose-500 font-semibold text-center bg-rose-500/5 border border-rose-500/10 rounded-lg">
                          ❌ Not deliverable here
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hostel_block"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hostel Block (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., BH-1, Block A"
                      {...field}
                      value={field.value ?? ""}
                      readOnly={allowedBuildings.length > 0}
                      className={cn(
                        "h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium",
                        allowedBuildings.length > 0 &&
                          "opacity-75 bg-muted/10 cursor-not-allowed"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Room Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 101, A-204"
                      {...field}
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-rose-500" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional instructions for delivery (e.g. drop at lobby, ring bell)..."
                    className="resize-none bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-muted/10 p-3 rounded-xl border border-border/20">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(e.target.checked)
                    }
                    className="h-5 w-5 rounded-md border-border/50 text-blue-600 focus:ring-blue-600/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                    Set as default address
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    This address will be pre-selected for future orders.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-3 pt-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-11 px-6 rounded-xl border-border/60 hover:bg-muted/30 font-semibold"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[130px] rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-orange-500 hover:opacity-90 active:scale-95 transition-all duration-300 text-white shadow-lg shadow-orange-500/10 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Address"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
