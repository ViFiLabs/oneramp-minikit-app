"use server";

import { MockSuccessTransactionReceipt } from "@/data";
import { TransactionPayload } from "@/src/hooks/useEVMPay";
import delay from "delay";

const DELAY_TIME = Number(process.env.DELAY_TIME!) || 4000;

export const mockOnChainTransaction = async (payload: TransactionPayload) => {
  console.log("payload", payload);
  await delay(DELAY_TIME);

  return MockSuccessTransactionReceipt.transactionReceipt;
};
