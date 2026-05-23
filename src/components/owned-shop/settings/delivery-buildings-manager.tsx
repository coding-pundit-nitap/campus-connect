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
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md border bg-muted/50 p-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Delivery Buildings</h3>
          <p className="text-sm text-muted-foreground">
            Select the hostels/buildings this shop can deliver to.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {deliveryBuildings.length > 0 ? (
          deliveryBuildings.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-2 px-3 py-1.5"
            >
              {item.building.name}
              {item.building.hostel_block
                ? ` (${item.building.hostel_block})`
                : ""}
              <button
                type="button"
                aria-label={`Remove ${item.building.name}`}
                onClick={() =>
                  removeDeliveryBuildingMutation.mutate(item.building_id)
                }
                disabled={isPending}
                className="rounded-sm hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No delivery buildings configured. Until you add one, checkout allows
            all saved addresses.
          </p>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <Select
          value={selectedBuildingId}
          onValueChange={setSelectedBuildingId}
          disabled={availableBuildings.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add an existing building" />
          </SelectTrigger>
          <SelectContent>
            {availableBuildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
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
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto]">
        <Input
          value={newBuildingName}
          onChange={(event) => setNewBuildingName(event.target.value)}
          placeholder="New building name"
        />
        <Input
          value={newHostelBlock}
          onChange={(event) => setNewHostelBlock(event.target.value)}
          placeholder="Hostel/block optional"
        />
        <Button
          type="button"
          variant="outline"
          onClick={createAndAddBuilding}
          disabled={!newBuildingName.trim() || isPending}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
