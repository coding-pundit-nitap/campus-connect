import axiosInstance from "@/lib/axios";
import type { ActionResponse } from "@/types";

export interface SerializedBuilding {
  id: string;
  name: string;
  hostel_block: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SerializedShopDeliveryBuilding {
  id: string;
  shop_id: string;
  building_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  building: SerializedBuilding;
}

class BuildingApiService {
  async getBuildings(): Promise<SerializedBuilding[]> {
    const response =
      await axiosInstance.get<ActionResponse<SerializedBuilding[]>>(
        "/buildings"
      );
    return response.data.data;
  }

  async getShopDeliveryBuildings(): Promise<SerializedShopDeliveryBuilding[]> {
    const response = await axiosInstance.get<
      ActionResponse<SerializedShopDeliveryBuilding[]>
    >("/vendor/delivery-buildings");
    return response.data.data;
  }

  async getPublicShopDeliveryBuildings(
    shopId: string
  ): Promise<SerializedBuilding[]> {
    const response = await axiosInstance.get<
      ActionResponse<SerializedBuilding[]>
    >(`/shops/${shopId}/delivery-buildings`);
    return response.data.data;
  }
}

export const buildingApiService = new BuildingApiService();
