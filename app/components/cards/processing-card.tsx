import React from "react";
import { FiLink, FiFileText } from "react-icons/fi";
import { Loader } from "lucide-react";
import { TransferType, Quote, Transfer } from "@/types";
import AssetAvator from "./asset-avator";
import CountryAvator from "./country-avator";
import { Button } from "@/components/ui/button";

interface ProcessingCardProps {
  transactionHash?: string;
  exploreUrl?: string;
  quote: Quote;
  transfer?: Transfer;
  onCancel: () => void;
  onGetReceipt: () => void;
}

const ProcessingCard: React.FC<ProcessingCardProps> = ({
  transactionHash,
  exploreUrl,
  quote,
  transfer,
  onGetReceipt,
  onCancel,
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
    <div className="min-h-screen text-white flex items-center w-full md:w-1/3 justify-center bg-black">
      <div className="w-full h-full max-w-lg">
        {/* Main Card */}
        <div className="bg-[#181818] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232323]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Loader size={16} className="animate-spin text-white" />
              </div>
              <h2 className="text-xl font-medium text-white">Processing</h2>
            </div>
            <button
              onClick={onGetReceipt}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiFileText size={24} />
            </button>
          </div>

          {/* Transaction Flow */}
          <div className="p-6">
            <div className="relative flex items-center gap-2 mb-8">
              {/* Source Card - Changes based on Transfer Type */}
              <div className="flex-1 bg-[#232323] rounded-xl p-6 h-44 flex flex-col items-center justify-center">
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
                  <h2 className="text-gray-300 font-mono text-sm">
                    {quote.transferType === TransferType.TransferIn
                      ? `${totalAmount.toFixed(2)} ${quote.fiatType}`
                      : `${Number(quote.amountPaid).toFixed(3)} ${
                          quote.cryptoType
                        }`}
                  </h2>
                </div>
              </div>

              {/* Arrow positioned in the middle */}
              {/* <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-[#181818] border-4 border-[#232323] rounded-xl p-2 md:p-3 shadow-lg text-yellow-500">
                  <FiArrowRight size={20} />
                </div>
              </div> */}

              {/* Destination Card - Changes based on Transfer Type */}
              <div className="flex-1 bg-[#232323] rounded-xl p-6 h-44 flex flex-col items-center justify-center">
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
                  <h2 className="text-gray-300 font-mono text-sm">
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
              {transactionHash && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Source TX</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      {transactionHash
                        ? `${transactionHash.slice(
                            0,
                            6
                          )}...${transactionHash.slice(-6)}`
                        : `${quote.address.slice(0, 6)}...${quote.address.slice(
                            -6
                          )}`}
                    </span>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Loader size={12} className="animate-spin text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Order ID */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Order ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm">
                    {quote.quoteId.slice(0, 6)}...{quote.quoteId.slice(-6)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#232323] my-4"></div>

              {/* Recipient Address */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Recipient address</span>
                <span className="text-white font-mono text-sm">
                  {quote.address.slice(0, 6)}...{quote.address.slice(-6)}
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Started at</span>
                <span className="text-white text-sm">{currentDate}</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-sm font-medium">
                    Processing
                  </span>
                  <Loader size={14} className="animate-spin text-yellow-500" />
                </div>
              </div>

              {/* Institution (if available) */}
              {transfer?.userActionDetails?.institutionName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Institution</span>
                  <span className="text-white text-sm">
                    {transfer.userActionDetails.institutionName}
                  </span>
                </div>
              )}

              {/* Explorer Link (if processing TransferOut) */}
              {quote.transferType === TransferType.TransferOut &&
                exploreUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">View Transaction</span>
                    <a
                      href={exploreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="text-sm">Explorer</span>
                      <FiLink size={14} />
                    </a>
                  </div>
                )}

              <div className="flex items-center justify-between">
                <Button
                  onClick={() => onCancel()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold h-14 rounded-xl transition-colors"
                >
                  Swap Again
                </Button>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingCard;
