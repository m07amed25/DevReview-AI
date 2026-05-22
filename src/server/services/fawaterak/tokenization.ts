import { fawaterakClient, FawaterakError } from "./client";
import { fawaterakConfig } from "./config";
import type {
  CreateCardTokenRequest,
  CreateCardTokenResponse,
  PayWithTokenRequest,
  PayWithTokenResponse,
} from "./types";

export const tokenization = {
  /**
   * Create a card token screen URL for hosted card capture
   */
  async createCardTokenScreen(
    data: CreateCardTokenRequest
  ): Promise<CreateCardTokenResponse["data"]> {
    const response = await fawaterakClient.post<CreateCardTokenResponse>(
      "/api/v2/cardtoken/screen",
      data
    );
    return response.data;
  },

  /**
   * Charge a saved card token
   */
  async payWithToken(
    data: PayWithTokenRequest
  ): Promise<PayWithTokenResponse["data"]> {
    const response = await fawaterakClient.post<PayWithTokenResponse>(
      "/api/v2/cardtoken/pay",
      data
    );
    return response.data;
  },

  /**
   * Delete a saved card token from Fawaterak
   */
  async deleteCustomerToken(
    customerUniqueId: string,
    cardTokenUniqueId: string
  ): Promise<boolean> {
    try {
      await fawaterakClient.post("/api/v2/cardtoken/delete", {
        customer_unique_id: customerUniqueId,
        card_token_unique_id: cardTokenUniqueId,
      });
      return true;
    } catch (error) {
      // Log but don't throw - we still want to remove the local record
      console.error("Fawaterak token deletion failed:", error);
      return false;
    }
  },
} as const;
