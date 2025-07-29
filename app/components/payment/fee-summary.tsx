import React from "react";

interface ConversionResponse {
  chargeFeeInFiat: number;
  chargeFeeInUsd: number;
  exchangeRate: number;
  fiatAmount: number;
  gasFeeInFiat: number;
  success: boolean;
}

interface ExchangeRateData {
  exchange: number;
  country: string;
  conversionResponse: ConversionResponse;
}

interface FeeSummaryProps {
  fiatAmount?: string;
  fiatCurrency?: string;
  cryptoAmount?: string;
  cryptoCurrency?: string;
  exchangeRateData?: ExchangeRateData;
}

const FeeSummarySkeleton = () => {
  return (
    <div className="w-full bg-[#202020] shadow-md rounded-lg p-4 text-white">
      <div className="space-y-3">
        {/* Transaction Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-24 h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-600 my-3"></div>

        {/* Exchange Rate */}
        <div className="flex justify-between items-center">
          <div className="w-32 h-4 bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const FeeSummary = ({
  fiatAmount = "1",
  fiatCurrency = "KES",
  cryptoAmount = "0.0077",
  cryptoCurrency = "USDC",
  exchangeRateData,
}: FeeSummaryProps) => {
  // Calculate fees from the exchange rate data
  // const totalFees = exchangeRateData?.conversionResponse
  //   ? exchangeRateData.conversionResponse.chargeFeeInFiat +
  //     exchangeRateData.conversionResponse.gasFeeInFiat
  //   : 2.5;

  // Use the user's input amount as the total (fees are already calculated based on this amount)
  const userInputAmount = parseFloat(fiatAmount || "0");
  const exchangeRate = exchangeRateData?.exchange || 129.2;

  // Format crypto amount to 2 decimal places
  const formattedCryptoAmount = parseFloat(cryptoAmount || "0").toFixed(2);

  // Helper function to format numbers with commas and 2 decimal places
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full bg-[#202020] shadow-md rounded-lg p-4 text-white">
      <div className="space-y-3">
        {/* Transaction Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Total {fiatCurrency}</span>
            <span className="text-white text-sm font-medium">
              {formatNumber(userInputAmount)} {fiatCurrency}
            </span>
          </div>
          {/* <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Fees</span>
            <span className="text-white text-sm font-medium">
              {formatNumber(totalFees)} {fiatCurrency}
            </span>
          </div> */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">
              Amount in {cryptoCurrency}
            </span>
            <span className="text-white text-sm font-medium">
              {formattedCryptoAmount} {cryptoCurrency}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-600 my-3"></div>

        {/* Exchange Rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">
            1 USD = {formatNumber(exchangeRate)} {fiatCurrency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeeSummary;
export { FeeSummarySkeleton };
