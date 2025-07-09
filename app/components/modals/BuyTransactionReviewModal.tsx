import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Institution } from "@/types";

interface BuyTransactionReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
  currency: string;
  currencyLogo: string;
  totalValue: string;
  recipient: string;
  account: string;
  institution: string | Institution;
  network: string;
  networkLogo: string;
  walletAddress?: string;
}

export function BuyTransactionReviewModal({
  open,
  onClose,
  onConfirm,
  amount,
  currency,
  currencyLogo,
  totalValue,
  recipient,
  account,
  institution,
  network,
  networkLogo,
  walletAddress,
}: BuyTransactionReviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#181818] rounded-2xl max-w-md w-[95%] shadow-2xl flex flex-col border border-[#232323] overflow-hidden">
        {/* Header */}
        <div className="bg-[#232323] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M19 12H5M5 12l7-7m-7 7l7 7"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h3 className="text-xl text-white font-semibold">
              Review Transaction
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Amount */}
          <div className="flex flex-col items-center gap-1 mb-3">
            <div className="text-neutral-400">You are purchasing</div>
            <div className="flex items-center gap-2">
              <Image
                src={currencyLogo}
                alt={currency}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-3xl text-white font-light">
                {amount} {currency}
              </span>
            </div>
            <div className="text-purple-400 font-semibold">{totalValue}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 bg-[#232323] rounded-full text-neutral-300">
                on {network}
              </span>
              <Image
                src={networkLogo}
                alt={network}
                width={18}
                height={18}
                className="rounded-full"
              />
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-[#232323] rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-white font-medium">Transaction Details</h4>

            <div className="flex justify-between">
              <span className="text-neutral-400">Recipient</span>
              <span className="text-white font-medium">{recipient}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">Account</span>
              <span className="text-white">{account}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">Institution</span>
              <span className="text-white">
                {(institution as Institution).name}
              </span>
            </div>

            {walletAddress && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Wallet Address</span>
                <span className="text-white truncate max-w-[200px]">
                  {walletAddress}
                </span>
              </div>
            )}
          </div>

          {/* Network Details */}
          <div className="bg-[#232323] rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-white font-medium">Fees</h4>

            <div className="flex justify-between">
              <span className="text-neutral-400">Network Fee</span>
              <span className="text-white">$0.005</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">Processing Time</span>
              <span className="text-white">~30 seconds</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <Button
              className="flex-1 bg-transparent hover:bg-[#232323] text-white border border-[#444] rounded-xl py-3"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl py-3"
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
