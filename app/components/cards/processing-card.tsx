"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiLink } from "react-icons/fi";
import { Loader, X } from "lucide-react";
import { TransferType, Quote, Transfer } from "@/types";
import AssetAvator from "./asset-avator";
import CountryAvator from "./country-avator";
import { Button } from "@/components/ui/button";
import TransactionsModal from "@/components/modals/transactions-modal";
import { useUserSelectionStore } from "@/store/user-selection";

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
  onCancel,
}) => {
  const { isPayout } = useUserSelectionStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipClosing, setIsTooltipClosing] = useState(false);
  const bellButtonRef = useRef<HTMLDivElement>(null);
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

  // Show tooltip after 10 seconds
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 10000);

    return () => clearTimeout(showTimer);
  }, []);

  // Auto-hide tooltip after 8 seconds once shown
  useEffect(() => {
    if (!showTooltip) return;

    const hideTimer = setTimeout(() => {
      setIsTooltipClosing(true);
      setTimeout(() => setShowTooltip(false), 300);
    }, 8000);

    return () => clearTimeout(hideTimer);
  }, [showTooltip]);

  const handleCloseTooltip = () => {
    setIsTooltipClosing(true);
    setTimeout(() => setShowTooltip(false), 300);
  };

  return (
    <div className="min-h-screen !bg-[#181818] text-white flex items-center w-full md:w-1/3 justify-center md:bg-black">
      <div className="w-full h-full max-w-lg">
        {/* Tooltip */}
        {showTooltip && (
          <div
            className={`absolute z-60 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs ${
              isTooltipClosing ? "animate-fade-out" : "animate-slide-in-top"
            }`}
            style={{
              // Position below and to the left of the bell icon
              top: bellButtonRef.current
                ? bellButtonRef.current.offsetTop +
                  bellButtonRef.current.offsetHeight +
                  8
                : "4rem",
              right: bellButtonRef.current ? "0.5rem" : "0.5rem",
            }}
          >
            {/* Arrow pointing up to bell icon */}
            <div className="absolute -top-2 right-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-600"></div>

            {/* Bell icon highlight/glow effect */}
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-600/20 rounded-full animate-pulse"></div>
            <div
              className="absolute -top-0.5 -right-0.5 w-6 h-6 bg-blue-600/40 rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>

            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  You don&apos;t need to stay on this screen!
                </p>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Your transaction will continue processing in the background.
                  You can close this page and track progress in the transaction
                  page.
                </p>
              </div>
              <button
                onClick={handleCloseTooltip}
                className="flex-shrink-0 text-blue-200 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#181818]  overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232323]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Loader size={16} className="animate-spin text-white" />
              </div>
              <h2 className="text-xl font-medium text-white">Processing</h2>
            </div>
            <div ref={bellButtonRef} className={showTooltip ? "relative" : ""}>
              {showTooltip && (
                <div className="absolute inset-0 bg-blue-600/10 rounded-full animate-pulse"></div>
              )}
              <TransactionsModal />
            </div>
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
                    <AssetAvator quote={quote} iconOnly />
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
                    {isPayout ? (
                      <>
                        {quote.transferType === TransferType.TransferIn
                          ? `${totalAmount.toFixed(2)} ${quote.fiatType}`
                          : `${Number(quote.cryptoAmount).toFixed(2)} ${
                              quote.cryptoType
                            }`}
                      </>
                    ) : (
                      <>
                        {quote.transferType === TransferType.TransferIn
                          ? `${totalAmount.toFixed(2)} ${quote.fiatType}`
                          : `${Number(quote.amountPaid).toFixed(3)} ${
                              quote.cryptoType
                            }`}
                      </>
                    )}
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
                    <AssetAvator quote={quote} iconOnly />
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
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Loader size={12} className="animate-spin text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Order ID */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Order ID</h2>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-mono text-sm">
                    {quote.quoteId.slice(0, 6)}...{quote.quoteId.slice(-6)}
                  </h2>
                </div>
              </div>

              {/* Recipient Address */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Recipient address</h2>
                <h2 className="text-white font-mono text-sm">
                  {quote.address.slice(0, 6)}...{quote.address.slice(-6)}
                </h2>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Started at</h2>
                <h2 className="text-white text-sm">{currentDate}</h2>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <h2 className="text-gray-400 text-sm">Status</h2>
                <div className="flex items-center gap-2">
                  <h2 className="text-yellow-500 text-sm font-medium">
                    Processing
                  </h2>
                  <Loader size={14} className="animate-spin text-yellow-500" />
                </div>
              </div>

              {/* Institution (if available) */}
              {transfer?.userActionDetails?.institutionName && (
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-400 text-sm">Institution</h2>
                  <h2 className="text-white text-sm">
                    {transfer.userActionDetails.institutionName}
                  </h2>
                </div>
              )}

              {/* Explorer Link (if processing TransferOut) */}
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

              <div className="flex items-center justify-between">
                <Button
                  onClick={() => onCancel()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base md:text-lg font-semibold h-14 rounded-xl transition-colors"
                >
                  Swap again
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
