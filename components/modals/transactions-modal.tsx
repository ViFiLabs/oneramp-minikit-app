"use client";

import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/actions/transfer";
import { Transaction, TransactionStatus } from "@/types";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";

// Transaction status types for UI
type UITransactionStatus = "processing" | "completed" | "failed" | "pending";

// Transaction interface for UI
interface UITransaction {
  id: string;
  orderType: string;
  status: UITransactionStatus;
  amount: string;
  currency: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  network: string;
  chain: string;
  timestamp: string;
  transactionHash?: string;
  recipientAddress: string;
  fee: string;
  estimatedTime?: string;
  progress?: number;
}

// Map API transaction status to UI status
const mapTransactionStatus = (
  status: TransactionStatus
): UITransactionStatus => {
  switch (status) {
    case TransactionStatus.INITIATED:
    case TransactionStatus.IN_PROGRESS:
      return "processing";
    case TransactionStatus.DONE:
      return "completed";
    case TransactionStatus.FAILED:
    case TransactionStatus.REFUNDED:
    case TransactionStatus.IS_REFUNDING:
      return "failed";
    default:
      return "pending";
  }
};

// Transform API transaction to UI transaction
const transformTransaction = (tx: Transaction): UITransaction => {
  return {
    id: tx._id,
    orderType: tx.orderType,
    status: mapTransactionStatus(tx.status),
    amount: tx.amount.toString(),
    currency: tx.currency,
    cryptoAmount: tx.recieves.toString(),
    cryptoCurrency: tx.asset,
    network: tx.network,
    chain: tx.chain,
    timestamp: tx.createdAt,
    transactionHash: tx.txId,
    recipientAddress: tx.address,
    fee: "0", // Fee not available in API response
    estimatedTime:
      tx.status === TransactionStatus.IN_PROGRESS ? "2-5 minutes" : undefined,
    progress: tx.status === TransactionStatus.IN_PROGRESS ? 65 : undefined,
  };
};

const STATUS_COLORS = {
  processing: "bg-yellow-400",
  pending: "bg-yellow-400",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const TAB_OPTIONS = [
  { key: "processing", label: "Processing" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

const TransactionsModal = () => {
  const [modalTxOpen, setModalTxOpen] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<
    "processing" | "completed" | "failed"
  >("processing");

  const { address, isConnected } = useWalletGetInfo();

  // Fetch transactions for each status
  const {
    data: processingTransactions = [],
    isLoading: isLoadingProcessing,
    error: processingError,
  } = useQuery({
    queryKey: ["transactions", address, "processing"],
    queryFn: () => getTransactions(address!, TransactionStatus.IN_PROGRESS),
    enabled: !!address && isConnected,
    refetchInterval: 10000, // Refetch every 10 seconds
    select: (data) => data.map(transformTransaction),
  });

  const {
    data: completedTransactions = [],
    isLoading: isLoadingCompleted,
    error: completedError,
  } = useQuery({
    queryKey: ["transactions", address, "completed"],
    queryFn: () => getTransactions(address!, TransactionStatus.DONE),
    enabled: !!address && isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
    select: (data) => data.map(transformTransaction),
  });

  const {
    data: failedTransactions = [],
    isLoading: isLoadingFailed,
    error: failedError,
  } = useQuery({
    queryKey: ["transactions", address, "failed"],
    queryFn: () => getTransactions(address!, TransactionStatus.FAILED),
    enabled: !!address && isConnected,
    refetchInterval: 60000, // Refetch every minute
    select: (data) => data.map(transformTransaction),
  });

  // Determine which transactions to show based on active tab
  let visibleTransactions: UITransaction[] = [];
  let isLoading = false;
  let error: Error | null = null;

  if (activeTab === "processing") {
    visibleTransactions = processingTransactions;
    isLoading = isLoadingProcessing;
    error = processingError as Error | null;
  } else if (activeTab === "completed") {
    visibleTransactions = completedTransactions;
    isLoading = isLoadingCompleted;
    error = completedError as Error | null;
  } else if (activeTab === "failed") {
    visibleTransactions = failedTransactions;
    isLoading = isLoadingFailed;
    error = failedError as Error | null;
  }

  // Only show badge for processing transactions
  const processingTransactionsCount = processingTransactions.length;

  const getStatusIcon = (status: UITransactionStatus) => {
    const iconBg =
      status === "processing"
        ? STATUS_COLORS.processing
        : status === "pending"
        ? STATUS_COLORS.pending
        : status === "completed"
        ? STATUS_COLORS.completed
        : status === "failed"
        ? STATUS_COLORS.failed
        : "bg-gray-400";
    const iconColor = status === "processing" ? "text-black" : "text-white";
    let Icon = Clock;
    if (status === "completed") Icon = CheckCircle;
    if (status === "failed") Icon = XCircle;
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${iconBg} bg-opacity-90`}
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </span>
    );
  };

  const getStatusText = (status: UITransactionStatus) => {
    switch (status) {
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: UITransactionStatus) => {
    switch (status) {
      case "processing":
        return "text-yellow-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const openExplorer = (hash: string) => {
    window.open(`https://basescan.org/tx/${hash}`, "_blank");
  };

  const TransactionCard = ({
    tx,
    isExpanded,
    onToggle,
  }: {
    tx: UITransaction;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div className="bg-[#202124] rounded-2xl p-5 mb-5 shadow-lg transition-all duration-200 hover:shadow-xl hover:bg-[#23232f] cursor-pointer">
      {/* Top Row: Status, Chevron */}
      <div className="flex items-center justify-between" onClick={onToggle}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(tx.status)}
          <p className={`font-semibold ${getStatusColor(tx.status)} text-base`}>
            {getStatusText(tx.status)} {tx.orderType.toLowerCase()} order
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto text-gray-400 hover:text-white ml-2 transition-transform duration-200"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Amount and Conversion Row */}
      <div className="flex items-center gap-2 mt-4 text-lg font-bold text-white">
        <p>
          {Number(tx.amount).toFixed(2)} {tx.currency}
        </p>
        <p className="text-gray-400 font-normal text-xl">→</p>
        <p>
          {Number(tx.cryptoAmount).toFixed(2)} {tx.cryptoCurrency}
        </p>
      </div>

      {/* Network and Date Row */}
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
        <Image
          src="/logos/base.png"
          alt={tx.network}
          width={18}
          height={18}
          className="rounded"
        />
        <p className="font-medium text-sm">{tx.chain}</p>
        <p className="mx-1">•</p>
        <p className="text-sm">{formatDate(tx.timestamp)}</p>
      </div>

      {/* Divider for expanded details */}
      {isExpanded && (
        <div className="my-4 border-t !border-[#2a2a2a] opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]" />
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 opacity-0 animate-[slideInFromTop_0.3s_ease-out_forwards]">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Amount</p>
            <p className="font-medium text-sm">
              {Number(tx.amount).toFixed(2)} {tx.currency}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">You&apos;ll receive</p>
            <p className="font-medium text-sm">
              {Number(tx.cryptoAmount).toFixed(2)} {tx.cryptoCurrency}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Network</p>
            <div className="flex items-center gap-2">
              <Image
                src="/logos/base.png"
                alt={tx.network}
                width={16}
                height={16}
                className="rounded"
              />
              <p className="font-medium text-sm">{tx.chain}</p>
            </div>
          </div>

          {/* Transaction Hash */}
          {tx.transactionHash && tx.transactionHash.length > 5 && (
            <div className="mt-4 pt-4 border-t !border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Transaction Hash</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openExplorer(tx.transactionHash!)}
                  className="p-1 h-auto text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm font-mono text-gray-300 mt-1">
                {truncateHash(tx.transactionHash)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        className="relative p-0 pr-3"
        onClick={() => setModalTxOpen(true)}
      >
        {processingTransactionsCount > 0 && (
          <Badge
            className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums absolute -top-1 -right-1"
            variant="destructive"
          >
            {processingTransactionsCount}
          </Badge>
        )}
        <Bell className="size-5 text-white" />
      </Button>

      <Dialog open={modalTxOpen} onOpenChange={setModalTxOpen}>
        <DialogContent className="fixed border-none inset-0 z-50 w-screen h-screen max-w-none max-h-none p-0 bg-[#181818] text-white flex flex-col translate-x-0 translate-y-0 top-0 lg:right-0 lg:left-auto lg:w-96 lg:max-w-sm lg:shadow-2xl lg:border-l lg:border-[#232323]">
          <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#232323]">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalTxOpen(false)}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Transactions</h2>
              </div>
            </div>

            {/* Tab Bar */}
            <div className="sticky top-0 z-10 bg-[#181818] px-4 pt-4 pb-2">
              <div className="flex w-full gap-2">
                {TAB_OPTIONS.map((tab) => (
                  <Button
                    key={tab.key}
                    className={`flex-1 py-2 rounded-full font-semibold text-sm transition-all relative
                        ${
                          activeTab === tab.key
                            ? "bg-white text-black shadow-lg border border-gray-200"
                            : "bg-[#23232f] text-gray-500 hover:bg-[#23232f]/80 border border-transparent"
                        }`}
                    style={{ transition: "background 0.2s, color 0.2s" }}
                    onClick={() =>
                      setActiveTab(
                        tab.key as "processing" | "completed" | "failed"
                      )
                    }
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                  <p className="text-gray-400">Loading transactions...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <XCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Error loading transactions
                  </h3>
                  <p className="text-gray-400 text-center text-sm">
                    Failed to load your transaction history. Please try again.
                  </p>
                </div>
              ) : visibleTransactions.length > 0 ? (
                <div className="space-y-5">
                  {visibleTransactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      tx={tx}
                      isExpanded={expandedTransactions.has(tx.id)}
                      onToggle={() => {
                        const newExpanded = new Set(expandedTransactions);
                        if (newExpanded.has(tx.id)) {
                          newExpanded.delete(tx.id);
                        } else {
                          newExpanded.add(tx.id);
                        }
                        setExpandedTransactions(newExpanded);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-8 h-8 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-400 text-center text-sm">
                    Your transaction history will appear here once you make your
                    first trade.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionsModal;
