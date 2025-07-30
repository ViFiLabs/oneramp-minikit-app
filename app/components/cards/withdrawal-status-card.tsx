"use client";

import React, { useState, useEffect } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { TransferType, Quote, Transfer, TransferStatusEnum } from "@/types";
import { Button } from "@/components/ui/button";
import { useUserSelectionStore } from "@/store/user-selection";
import { PAY_SUPPORTED_COUNTRIES } from "@/data/countries";

interface WithdrawalStatusCardProps {
  quote: Quote;
  transfer?: Transfer;
  isProcessing: boolean;
  isFailed?: boolean;
  onDone: () => void;
}

const WithdrawalStatusCard: React.FC<WithdrawalStatusCardProps> = ({
  quote,
  transfer,
  isProcessing,
  isFailed = false,
  onDone,
}) => {
  const { updateSelection, resetToDefault } = useUserSelectionStore();

  // Calculate amounts based on country
  let totalAmount = 0;
  const isPaySupportedCountry = PAY_SUPPORTED_COUNTRIES.some(
    (country) => country.countryCode === quote.country
  );

  if (isPaySupportedCountry) {
    totalAmount = Number(quote.fiatAmount);
  } else {
    totalAmount = Number(quote.fiatAmount) + Number(quote.feeInFiat);
  }

  // For withdrawal (TransferOut), we're swapping crypto for fiat
  const cryptoAmount = Number(quote.amountPaid);
  const fiatAmount = totalAmount;

  const handleDone = () => {
    resetToDefault();
    onDone();
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
      <div className="w-full h-full max-w-sm flex flex-col items-center justify-center px-6 space-y-6">
        {/* Status Icon */}
        <div className="flex items-center justify-center">
          {isProcessing ? (
            // Three bouncing dots
            <div className="flex space-x-2">
              <div 
                className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div 
                className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div 
                className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          ) : isFailed ? (
            // Red circle with X for failure
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <FiX size={24} color="#ffffff" />
            </div>
          ) : (
            // Circle with checkmark for success
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <FiCheck size={24} color="#ffffff" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <h1 className="text-xl font-semibold text-center text-white">
          {isProcessing ? "" : isFailed ? "Transaction Failed" : "Successfully swapped"}
        </h1>

        {/* Amount Display - Show for both states */}
        <div className="text-center">
          <h2 className={`text-4xl font-bold mb-2 ${isFailed ? 'text-red-500' : 'text-blue-500'}`}>
            ${fiatAmount.toFixed(2)}
          </h2>
          
          {/* Transaction Description - Show for both states */}
          <p className="text-white text-center text-base">
            {`${cryptoAmount.toFixed(1)} ${quote.cryptoType} for ${fiatAmount.toFixed(0)} ${quote.fiatType} on ${quote.network.charAt(0).toUpperCase() + quote.network.slice(1)}`}
          </p>
        </div>

        {/* Action Button - Only show when completed or failed */}
        {!isProcessing && (
          <Button
            onClick={handleDone}
            className={`w-full text-white text-lg font-semibold h-14 rounded-full transition-all duration-300 ${
              isFailed 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {isFailed ? "Try Again" : "Done"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default WithdrawalStatusCard;
