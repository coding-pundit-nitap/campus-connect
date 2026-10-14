import { apiGet } from "../api-client";

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
    return apiGet<SerializedBuilding[]>("/buildings");
  }

  async getShopDeliveryBuildings(): Promise<SerializedShopDeliveryBuilding[]> {
    return apiGet<SerializedShopDeliveryBuilding[]>(
      "/vendor/delivery-buildings"
    );
  }

  async getPublicShopDeliveryBuildings(
    shopId: string
  ): Promise<SerializedBuilding[]> {
    return apiGet<SerializedBuilding[]>(`/shops/${shopId}/delivery-buildings`);
  }
}

export const buildingApiService = new BuildingApiService();
