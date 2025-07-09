"use server";
import { oneRampApi } from "@/constants";
import { QuoteRequest } from "@/types";
// const DELAY_TIME = Number(process.env.DELAY_TIME!) || 4000;

export const createQuoteIn = async (payload: QuoteRequest) => {
  try {
    // Add an artificial delay
    // await delay(DELAY_TIME);
    const response = await oneRampApi.post("/quote-in", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to create quote", { cause: error });
  }
};

export const createQuoteOut = async (payload: QuoteRequest) => {
  try {
    // Add an artificial delay
    // await delay(DELAY_TIME);
    const response = await oneRampApi.post("/quote-out", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to create quote", { cause: error });
  }
};

export const createQuoteInBuy = async (payload: QuoteRequest) => {
  try {
    const response = await oneRampApi.post("/quote-in", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to create quote", { cause: error });
  }
};
