"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createBatchSlotAction,
  deleteBatchSlotAction,
  listBatchSlotsAction,
  reorderBatchSlotsAction,
  updateBatchSlotAction,
} from "@/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

type SlotRow = {
  id: string;
  cutoff_time_minutes: number;
  label: string | null;
  is_active: boolean;
  sort_order: number;
};

function minutesToTime(minutes: number): string {
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(1439, h * 60 + m));
}

export function BatchCardsManager() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["owner", "batch-cards"],
    queryFn: async () => {
      const res = await listBatchSlotsAction();
      return res.data as SlotRow[];
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState("17:00");
  const [newLabel, setNewLabel] = useState("");

  const [editing, setEditing] = useState<SlotRow | null>(null);
  const [editTime, setEditTime] = useState("17:00");
  const [editLabel, setEditLabel] = useState("");
  const [editActive, setEditActive] = useState(true);

  const createSlot = useMutation({
    mutationFn: () =>
      createBatchSlotAction({
        cutoff_time_minutes: timeToMinutes(newTime),
        label: newLabel || null,
      }),
    onSuccess: (res) => {
      toast.success(res.details || "Created");
      setNewLabel("");
      setNewTime("17:00");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["owner", "batch-cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSlot = useMutation({
    mutationFn: (input: {
      id: string;
      cutoff_time_minutes: number;
      label: string | null;
      is_active?: boolean;
    }) => updateBatchSlotAction(input),
    onSuccess: (res) => {
      toast.success(res.details || "Updated");
      queryClient.invalidateQueries({ queryKey: ["owner", "batch-cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderSlots = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderBatchSlotsAction({ ordered_ids: orderedIds }),
    onSuccess: (res) => {
      toast.success(res.details || "Reordered");
      queryClient.invalidateQueries({ queryKey: ["owner", "batch-cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSlot = useMutation({
    mutationFn: (id: string) => deleteBatchSlotAction(id),
    onSuccess: (res) => {
      toast.success(res.details || "Deleted");
      queryClient.invalidateQueries({ queryKey: ["owner", "batch-cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const slots = useMemo(() => {
    return (data || []).slice().sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.cutoff_time_minutes - b.cutoff_time_minutes;
    });
  }, [data]);

  const move = (id: string, direction: "up" | "down") => {
    const idx = slots.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= slots.length) return;

    const next = slots.slice();
    const tmp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = tmp;

    const orderedIds = next.map((s) => s.id);
    queryClient.setQueryData(["owner", "batch-cards"], next);
    reorderSlots.mutate(orderedIds);
  };

  const openEdit = (slot: SlotRow) => {
    setEditing(slot);
    setEditTime(minutesToTime(slot.cutoff_time_minutes));
    setEditLabel(slot.label ?? "");
    setEditActive(slot.is_active);
  };

  const saveEdit = () => {
    if (!editing) return;
    updateSlot.mutate({
      id: editing.id,
      cutoff_time_minutes: timeToMinutes(editTime),
      label: editLabel || null,
      is_active: editActive,
    });
    setEditing(null);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4">Loading schedule…</div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive p-4">
        {(error as Error)?.message || "Failed to load batch cards"}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b bg-muted/10 pb-5">
        <div className="space-y-1">
          <CardTitle className="text-xl">Batch Delivery Schedule</CardTitle>
          <CardDescription>
            Configure daily cutoff times. If empty, the shop runs in
            direct-delivery mode.
          </CardDescription>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="shrink-0 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Slot
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Inline Add Row */}
        {isAdding && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-4 space-y-1.5">
                <Label className="text-xs font-semibold text-primary">
                  Cutoff time
                </Label>
                <Input
                  value={newTime}
                  onChange={(e) => setNewTime(e.currentTarget.value)}
                  type="time"
                  className="bg-background shadow-sm"
                />
              </div>
              <div className="sm:col-span-5 space-y-1.5">
                <Label className="text-xs font-semibold text-primary">
                  Label (optional)
                </Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.currentTarget.value)}
                  placeholder='e.g. "5 PM Batch"'
                  className="bg-background shadow-sm"
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button
                  className="flex-1 shadow-sm"
                  onClick={() => createSlot.mutate()}
                  disabled={createSlot.isPending}
                >
                  {createSlot.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-background hover:bg-muted"
                  onClick={() => setIsAdding(false)}
                  disabled={createSlot.isPending}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {slots.length === 0 && !isAdding && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/20">
            No batch slots configured. Click "Add Slot" to start building your
            schedule.
          </div>
        )}

        {slots.map((slot) => (
          <div
            key={slot.id}
            className={cn(
              "rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
              !slot.is_active && "opacity-75 bg-muted/30"
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 bg-muted/50 rounded-md py-1 px-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => move(slot.id, "up")}
                    disabled={
                      reorderSlots.isPending || slots[0]?.id === slot.id
                    }
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => move(slot.id, "down")}
                    disabled={
                      reorderSlots.isPending ||
                      slots[slots.length - 1]?.id === slot.id
                    }
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-bold tracking-tight">
                    {minutesToTime(slot.cutoff_time_minutes)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {slot.label ? slot.label : "Unnamed Slot"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={slot.is_active}
                    onCheckedChange={(checked) =>
                      updateSlot.mutate({
                        id: slot.id,
                        cutoff_time_minutes: slot.cutoff_time_minutes,
                        label: slot.label,
                        is_active: checked,
                      })
                    }
                  />
                  <span
                    className={cn(
                      "text-xs font-medium w-12",
                      slot.is_active
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {slot.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(slot)}
                    disabled={updateSlot.isPending}
                    className="h-8"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteSlot.isPending}
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete batch slot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the cutoff time from your
                          shop schedule.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSlot.mutate(slot.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Batch Slot</DialogTitle>
            <DialogDescription>
              Update the cutoff time, label, and active state.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cutoff time</Label>
              <Input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.currentTarget.value)}
                className="shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Label</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.currentTarget.value)}
                placeholder='e.g. "5 PM Batch"'
                className="shadow-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Slot Status</p>
                <p className="text-xs text-muted-foreground">
                  Inactive slots are hidden from checkout.
                </p>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={updateSlot.isPending}
              className="shadow-sm"
            >
              {updateSlot.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
