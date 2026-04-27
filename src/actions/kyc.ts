"use server";
import { oneRampApi } from "@/constants";

export const getKYC = async (address: string) => {
  try {
    if (!address) {
      return null;
    }

    const response = await oneRampApi.get(`/kyc`, {
      params: { address },
    });

    return response.data;
  } catch (error) {
    // 404 = no KYC record bound to this address yet — surface as null,
    // not as a thrown error. The api migrated to a canonical 404 shape
    // for misses; the frontend treats "no record" as an empty state.
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw new Error("Failed to get KYC", { cause: error });
  }
};
