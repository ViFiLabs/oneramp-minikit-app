import React from "react";
import { FiLink, FiArrowRight, FiFileText } from "react-icons/fi";
import { Loader } from "lucide-react";
import { TransferType, TransferStatus } from "@/types";

import CountryAvator from "@/app/components/cards/country-avator";
import AssetAvator from "@/app/components/cards/asset-avator";

interface TransactionCardProps {
  transferStatus: TransferStatus;
  exploreUrl?: string;
  onCancel: () => void;
  onGetReceipt: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transferStatus,
  exploreUrl,
  onGetReceipt,
}) => {
  const currentDate =
    new Date().toLocaleDateString("en-CA") +
    " " +
    new Date().toLocaleTimeString("en-GB");

  let totalAmount = 0;
  if (transferStatus.fiatType === "KES" || transferStatus.fiatType === "UGX") {
    totalAmount = Number(transferStatus.amountProvided);
  } else {
    totalAmount = Number(transferStatus.amountProvided);
  }

  return (
    <div className="min-h-screen text-white flex items-center w-full md:w-1/3 justify-center bg-black">
      <div className="w-full h-full max-w-lg">
        {/* Main Card */}
        <div className="bg-[#181818] rounded-2xl border border-[#232323] overflow-hidden">
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
                  {transferStatus.transferType === TransferType.TransferIn ? (
                    <CountryAvator country="UG" iconOnly />
                  ) : (
                    <AssetAvator
                      cryptoType={transferStatus.cryptoType}
                      cryptoAmount={transferStatus.amountReceived}
                      iconOnly
                    />
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-gray-300 font-mono text-base">
                    {transferStatus.transferType === TransferType.TransferIn
                      ? `${totalAmount.toFixed(2)} ${transferStatus.fiatType}`
                      : `${Number(transferStatus.amountReceived).toFixed(3)} ${
                          transferStatus.cryptoType
                        }`}
                  </h2>
                </div>
              </div>

              {/* Arrow positioned in the middle */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-[#181818] border-4 border-[#232323] rounded-xl p-2 md:p-3 shadow-lg text-yellow-500">
                  <FiArrowRight size={20} />
                </div>
              </div>

              {/* Destination Card - Changes based on Transfer Type */}
              <div className="flex-1 bg-[#232323] rounded-xl p-6 h-44 flex flex-col items-center justify-center">
                <div className="mb-4 flex items-center justify-center relative size-24">
                  {transferStatus.transferType === TransferType.TransferIn ? (
                    <AssetAvator
                      cryptoType={transferStatus.cryptoType}
                      cryptoAmount={transferStatus.amountReceived}
                      iconOnly
                    />
                  ) : (
                    <CountryAvator country="UG" iconOnly />
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-gray-300 font-mono text-base">
                    {transferStatus.transferType === TransferType.TransferIn
                      ? `${Number(transferStatus.amountReceived).toFixed(3)} ${
                          transferStatus.cryptoType
                        }`
                      : `${totalAmount.toFixed(2)} ${transferStatus.fiatType}`}
                  </h2>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              {/* Source TX */}
              {transferStatus.txHash && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Source TX</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      {`${transferStatus.txHash.slice(
                        0,
                        6
                      )}...${transferStatus.txHash.slice(-6)}`}
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
                    {transferStatus.transferId.slice(0, 6)}...
                    {transferStatus.transferId.slice(-6)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#232323] my-4"></div>

              {/* Recipient Address */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Recipient address</span>
                <span className="text-white font-mono text-sm">
                  {transferStatus.transferAddress.slice(0, 6)}...
                  {transferStatus.transferAddress.slice(-6)}
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
              {transferStatus?.userActionDetails?.institutionName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Institution</span>
                  <span className="text-white text-sm">
                    {transferStatus.userActionDetails.institutionName}
                  </span>
                </div>
              )}

              {/* Explorer Link (if processing TransferOut) */}
              {transferStatus.transferType === TransferType.TransferOut &&
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

              {/* <div className="flex items-center justify-between">
                <span className="text-gray-400">Action</span>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="bg-transparent px-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm font-medium h-14 rounded-xl transition-colors"
                >
                  Go Back
                </Button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
