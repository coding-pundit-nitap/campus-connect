"use client";

import { MapPin, Plus, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useAddShopDeliveryBuilding,
  useBuildings,
  useCreateBuilding,
  useRemoveShopDeliveryBuilding,
  useShopDeliveryBuildings,
} from "@/hooks/queries/useBuildings";

export function DeliveryBuildingsManager() {
  const { data: buildings = [] } = useBuildings();
  const { data: deliveryBuildings = [] } = useShopDeliveryBuildings();
  const createBuildingMutation = useCreateBuilding();
  const addDeliveryBuildingMutation = useAddShopDeliveryBuilding();
  const removeDeliveryBuildingMutation = useRemoveShopDeliveryBuilding();
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newHostelBlock, setNewHostelBlock] = useState("");

  const activeBuildingIds = new Set(
    deliveryBuildings.map((item) => item.building_id)
  );
  const availableBuildings = buildings.filter(
    (building) => !activeBuildingIds.has(building.id)
  );
  const isPending =
    createBuildingMutation.isPending ||
    addDeliveryBuildingMutation.isPending ||
    removeDeliveryBuildingMutation.isPending;

  const addSelectedBuilding = () => {
    if (!selectedBuildingId) return;
    addDeliveryBuildingMutation.mutate(selectedBuildingId, {
      onSuccess: () => setSelectedBuildingId(""),
    });
  };

  const createAndAddBuilding = () => {
    const name = newBuildingName.trim();
    if (!name) return;

    createBuildingMutation.mutate(
      {
        name,
        hostel_block: newHostelBlock.trim() || null,
      },
      {
        onSuccess: (response) => {
          const buildingId = response.data?.id;
          if (buildingId) {
            addDeliveryBuildingMutation.mutate(buildingId);
          }
          setNewBuildingName("");
          setNewHostelBlock("");
        },
      }
    );
  };

  return (
    <div className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl p-6 relative shadow-xl shadow-blue-500/[0.01] overflow-hidden space-y-5">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 to-orange-400/20" />
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-border/40 bg-blue-500/10 p-2.5 shrink-0 mt-0.5">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground leading-tight">
            Delivery Buildings
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
            Select the hostels/buildings on campus this shop can deliver to.
          </p>
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="flex flex-wrap gap-2 pt-1 min-h-[40px]">
        {deliveryBuildings.length > 0 ? (
          deliveryBuildings.map((item) => (
            <Badge
              key={item.id}
              variant="outline"
              className="gap-2 px-3 py-1.5 font-semibold text-xs border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-xl"
            >
              <span>
                {item.building.name}
                {item.building.hostel_block
                  ? ` (${item.building.hostel_block})`
                  : ""}
              </span>
              <button
                type="button"
                aria-label={`Remove ${item.building.name}`}
                onClick={() =>
                  removeDeliveryBuildingMutation.mutate(item.building_id)
                }
                disabled={isPending}
                className="rounded-full hover:bg-red-500/10 hover:text-red-500 p-0.5 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-xs text-muted-foreground/80 italic font-medium leading-normal">
            No delivery locations configured. Active delivery allows checkout to
            any campus building.
          </p>
        )}
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Add Existing Campus Location
          </span>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Select
              value={selectedBuildingId}
              onValueChange={setSelectedBuildingId}
              disabled={availableBuildings.length === 0}
            >
              <SelectTrigger className="w-full h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-xs text-left">
                <SelectValue placeholder="Add an existing building" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/30 bg-card shadow-xl">
                {availableBuildings.map((building) => (
                  <SelectItem
                    key={building.id}
                    value={building.id}
                    className="text-xs font-semibold focus:bg-muted/60 focus:text-foreground cursor-pointer rounded-lg m-1"
                  >
                    {building.name}
                    {building.hostel_block ? ` (${building.hostel_block})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addSelectedBuilding}
              disabled={!selectedBuildingId || isPending}
              className="h-11 px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow shadow-blue-500/10 border-none shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Create Custom Location
          </span>
          <div className="grid gap-2 md:grid-cols-[1fr_minmax(0,0.7fr)_auto]">
            <Input
              value={newBuildingName}
              onChange={(event) => setNewBuildingName(event.target.value)}
              placeholder="Building name (e.g. Block D)"
              className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-xs"
            />
            <Input
              value={newHostelBlock}
              onChange={(event) => setNewHostelBlock(event.target.value)}
              placeholder="Hostel block (optional)"
              className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={createAndAddBuilding}
              disabled={!newBuildingName.trim() || isPending}
              className="h-11 px-4 rounded-xl border-border/60 hover:bg-muted/40 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shrink-0"
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
