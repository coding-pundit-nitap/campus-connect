"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createAnnouncementAction, deleteAnnouncementAction } from "@/actions";
import { announcementAPIService } from "@/services/announcement";

// Extend queryKeys object locally for announcements
const announcementKeys = {
  all: ["announcements"] as const,
  list: () => ["announcements", "list"] as const,
  shopList: () => ["announcements", "shop-list"] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: () => announcementAPIService.fetchAnnouncements(),
    staleTime: 10_000,
  });
}

export function useShopAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.shopList(),
    queryFn: () => announcementAPIService.fetchShopAnnouncements(),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncementAction,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.details || "Announcement published successfully!");
        queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      } else {
        toast.error(res.details || "Failed to publish announcement");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to publish announcement");
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncementAction,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.details || "Announcement deleted successfully");
        queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      } else {
        toast.error(res.details || "Failed to delete announcement");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete announcement");
    },
  });
}
