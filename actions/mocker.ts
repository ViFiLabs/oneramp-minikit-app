"use server";

import { MockSuccessTransactionReceipt } from "@/dummy";
import { TransactionPayload } from "@/onchain/useEVMPay";
import delay from "delay";

const DELAY_TIME = Number(process.env.DELAY_TIME!) || 4000;

export const mockOnChainTransaction = async (payload: TransactionPayload) => {
  console.log("Request", payload);
  await delay(DELAY_TIME);

  return MockSuccessTransactionReceipt.transactionReceipt;
};
