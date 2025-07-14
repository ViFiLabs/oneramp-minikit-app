import React from "react";
import { FiCheck, FiLink, FiXCircle } from "react-icons/fi";
import { TransferType, Quote } from "@/types";
import AssetAvator from "./asset-avator";
import { Button } from "@/components/ui/button";
import CountryAvator from "./country-avator";
import SupportButton from "../buttons/support-button";
import TransactionsModal from "@/components/modals/transactions-modal";

interface FailedCardProps {
  transactionHash?: string;
  exploreUrl?: string;
  quote: Quote;
  onNewPayment: () => void;
  onGetReceipt: () => void;
  transferId?: string;
}

const FailedCard: React.FC<FailedCardProps> = ({
  transactionHash,
  exploreUrl,
  quote,
  onNewPayment,
  onGetReceipt,
  transferId,
}) => {
  const currentDate =
    new Date().toLocaleDateString("en-CA") +
    " " +
    new Date().toLocaleTimeString("en-GB");

  let totalAmount = 0;
  if (quote.country === "KE" || quote.country === "UG") {
    totalAmount = Number(quote.fiatAmount);
  } else {
    totalAmount = Number(quote.fiatAmount) + Number(quote.feeInFiat);
  }

  return (
    <div className="min-h-screen w-full  md:w-1/3 text-white flex items-center justify-center bg-black">
      <div className="w-full h-full max-w-lg">
        {/* Main Card */}
        <div className="bg-[#181818]  overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232323]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <FiXCircle size={16} color="#fff" />
              </div>
              <h2 className="text-xl font-medium text-red-500">Failed</h2>
            </div>
            <button
              onClick={onGetReceipt}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <TransactionsModal />
            </button>
          </div>

          {/* Transaction Flow */}
          <div className="p-6">
            <div className="relative flex items-center gap-2 mb-8">
              {/* Source Card - Changes based on Transfer Type */}
              <div className="flex-1 bg-[#232323] rounded-xl p-6 w-full h-44 flex flex-col items-center justify-center">
                <div className="mb-4 flex items-center justify-center relative size-24">
                  {quote.transferType === TransferType.TransferIn ? (
                    <CountryAvator country={quote.country} iconOnly />
                  ) : (
                    <AssetAvator
                      cryptoType={quote.cryptoType}
                      cryptoAmount={quote.amountPaid}
                      iconOnly
                    />
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-lg font-medium text-white mb-1">
                    {quote.transferType === TransferType.TransferIn
                      ? quote.fiatType
                      : quote.network.charAt(0).toUpperCase() +
                        quote.network.slice(1)}
                  </h1>
                  <h2 className="text-gray-300 font-mono text-base font-semibold">
                    {quote.transferType === TransferType.TransferIn
                      ? `${totalAmount.toFixed(2)} ${quote.fiatType}`
                      : `${Number(quote.amountPaid).toFixed(3)} ${
                          quote.cryptoType
                        }`}
                  </h2>
                </div>
              </div>

              {/* Destination Card - Changes based on Transfer Type */}
              <div className="flex-1 bg-[#232323] rounded-xl p-6 w-full h-44 flex flex-col items-center justify-center">
                <div className="mb-4 flex items-center justify-center relative size-24">
                  {quote.transferType === TransferType.TransferIn ? (
                    <AssetAvator
                      cryptoType={quote.cryptoType}
                      cryptoAmount={quote.amountPaid}
                      iconOnly
                    />
                  ) : (
                    <CountryAvator country={quote.country} iconOnly />
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-lg font-medium text-white mb-1">
                    {quote.transferType === TransferType.TransferIn
                      ? quote.network.charAt(0).toUpperCase() +
                        quote.network.slice(1)
                      : quote.fiatType}
                  </h1>
                  <h2 className="text-gray-300 font-mono text-base font-semibold text-center">
                    {quote.transferType === TransferType.TransferIn
                      ? `${Number(quote.amountPaid).toFixed(3)} ${
                          quote.cryptoType
                        }`
                      : `${totalAmount.toFixed(2)} ${quote.fiatType}`}
                  </h2>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              {/* Source TX */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Source TX</h2>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-mono text-sm">
                    {transactionHash
                      ? `${transactionHash.slice(
                          0,
                          6
                        )}...${transactionHash.slice(-6)}`
                      : `${quote.address.slice(0, 6)}...${quote.address.slice(
                          -6
                        )}`}
                  </h2>
                  <FiCheck size={16} color="#10b981" />
                </div>
              </div>

              {/* Destination TX */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Order ID</h2>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-mono text-sm">
                    {quote.quoteId.slice(0, 6)}...{quote.quoteId.slice(-6)}
                  </h2>
                  <FiCheck size={16} color="#10b981" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t !border-[#232323] my-4"></div>

              {/* Recipient Address */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Recipient address</h2>
                <h2 className="text-white font-mono text-sm">
                  {quote.address.slice(0, 6)}...{quote.address.slice(-6)}
                </h2>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Timestamp</h2>
                <h2 className="text-white text-sm">{currentDate}</h2>
              </div>

              {/* Explorer Link */}
              {quote.transferType === TransferType.TransferOut &&
                exploreUrl && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-400 text-sm">View Transaction</h2>
                    <a
                      href={exploreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <h2 className="text-sm">Explorer</h2>
                      <FiLink size={14} />
                    </a>
                  </div>
                )}
            </div>

            {/* Action Button */}
            <div className="mt-8 w-full flex flex-row gap-4">
              <Button
                onClick={onNewPayment}
                className="w-1/2 !bg-neutral-800  hover:bg-transparent text-neutral-300 text-sm font-semibold h-14 rounded-xl transition-colors"
              >
                Try again
              </Button>
              <SupportButton transactionId={transferId || ""} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailedCard;
