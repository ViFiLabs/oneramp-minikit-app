import { mockOnChainTransaction } from "@/actions/mocker";
import { MOCK_TRANSACTIONS } from "@/constants";
import { useState } from "react";
import { erc20Abi, TransactionReceipt, parseUnits } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

// Starknet imports

export type TransactionPayload = {
  recipient: string;
  amount: string | number;
  tokenAddress: string;
};

export interface EVMPayHookReturn {
  payWithEVM: (
    transactionPayload: TransactionPayload,
    handleSuccess: (data: string) => void,
    handleFailed: (error: Error) => void
  ) => Promise<unknown>;
  isLoading: boolean;
  isSuccess: boolean;
  transactionReceipt: TransactionReceipt | null;
  resetState: () => void;
  isError: boolean;
}

export const TOKEN_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
];

const useEVMPay = (): // handleSuccess: () => void,
// handleFailed: (error: Error) => void
EVMPayHookReturn => {
  const [mockLoading, setMockLoading] = useState(false);
  const [mockSuccess, setMockSuccess] = useState(false);
  const [mockTransactionReceipt, setMockTransactionReceipt] =
    useState<TransactionReceipt | null>(null);

  const {
    writeContract,
    data: hash,
    reset: resetWrite,
    isError: isWriteError,
  } = useWriteContract();
  const {
    isLoading,
    isSuccess,
    data: transactionReceipt,
    isError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const resetState = () => {
    // Reset mock states
    setMockLoading(false);
    setMockSuccess(false);
    setMockTransactionReceipt(null);

    // Reset wagmi states
    resetWrite?.();
  };

  const payWithEVM = async (
    transactionPayload: TransactionPayload,
    handleSuccess: (data: string) => void,
    handleFailed: (error: Error) => void
  ) => {
    // Reset state before new transaction
    resetState();

    const { recipient, amount, tokenAddress } = transactionPayload;
    // Convert amount to the correct format for the contract call
    // For USDC/USDT, we use 6 decimals
    const amountInWei = parseUnits(amount.toString(), 6);

    return writeContract(
      {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amountInWei],
      },
      {
        onSuccess: (data) => {
          handleSuccess(data as unknown as string);
        },
        onError: (error) => {
          handleFailed(error);
        },
      }
    );
  };

  const mockPayWithEVM = async (transactionPayload: TransactionPayload) => {
    // Reset state before new transaction
    resetState();

    setMockLoading(true);
    const transactionReceipt = await mockOnChainTransaction(transactionPayload);
    setMockSuccess(true);
    setMockTransactionReceipt(
      transactionReceipt as unknown as TransactionReceipt
    );
    setMockLoading(false);
    return transactionReceipt;
  };

  return {
    payWithEVM: MOCK_TRANSACTIONS ? mockPayWithEVM : payWithEVM,
    isLoading: MOCK_TRANSACTIONS ? mockLoading : isLoading,
    isSuccess: MOCK_TRANSACTIONS ? mockSuccess : isSuccess,
    isError: MOCK_TRANSACTIONS ? false : isError || isWriteError,
    transactionReceipt: MOCK_TRANSACTIONS
      ? mockTransactionReceipt
      : transactionReceipt || null,
    resetState,
  };
};

export default useEVMPay;
