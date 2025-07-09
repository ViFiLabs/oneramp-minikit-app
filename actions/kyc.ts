"use server";
import { oneRampApi } from "@/constants";

export const getKYC = async (address: string) => {
  try {
    if (!address) {
      return null;
    }

    const response = await oneRampApi.get(`/kyc/${address}`);

    return response.data;
  } catch (error) {
    throw new Error("Failed to get KYC", { cause: error });
  }
};
