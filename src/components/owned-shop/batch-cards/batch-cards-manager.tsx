"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
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
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">
        {(error as Error)?.message || "Failed to load batch cards"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Batch cards</CardTitle>
          <CardDescription>
            Add daily cutoff times. If you keep this empty, your shop runs in
            direct-delivery mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-3">
            <Label className="text-xs">Cutoff time</Label>
            <Input
              value={newTime}
              onChange={(e) => setNewTime(e.currentTarget.value)}
              type="time"
            />
          </div>
          <div className="sm:col-span-7">
            <Label className="text-xs">Label (optional)</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.currentTarget.value)}
              placeholder='e.g. "5 PM Batch"'
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              className="w-full"
              onClick={() => createSlot.mutate()}
              disabled={createSlot.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slots.length === 0 && (
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              No batch cards configured.
            </div>
          )}
          {slots.map((slot) => (
            <div key={slot.id} className="rounded-lg border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {minutesToTime(slot.cutoff_time_minutes)}
                    {slot.label ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {slot.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order: {slot.sort_order}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(slot.id, "up")}
                      disabled={
                        reorderSlots.isPending || slots[0]?.id === slot.id
                      }
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(slot.id, "down")}
                      disabled={
                        reorderSlots.isPending ||
                        slots[slots.length - 1]?.id === slot.id
                      }
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
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
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(slot)}
                    disabled={updateSlot.isPending}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteSlot.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete batch card?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the cutoff time from your shop
                          schedule.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSlot.mutate(slot.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit batch card</DialogTitle>
            <DialogDescription>
              Update the cutoff time, label, and active state.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-xs">Cutoff time</Label>
              <Input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Label</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.currentTarget.value)}
                placeholder='e.g. "5 PM Batch"'
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Inactive cards won’t be offered at checkout.
                </p>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateSlot.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
