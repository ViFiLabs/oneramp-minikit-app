import { assets } from "@/data/currencies";
import { Quote } from "@/types";
import Image from "next/image";
import React from "react";

const AssetAvator = ({
  iconOnly,
  quote,
}: {
  iconOnly?: boolean;
  quote: Quote;
}) => {
  if (!quote) return null;

  const cryptoLogo = assets.find(
    (asset) => asset.symbol === quote.cryptoType
  )?.logo;
  if (iconOnly) {
    return <Image src={cryptoLogo!} alt={quote.cryptoType} fill />;
  }

  const amount =
    quote.requestType === "fiat"
      ? Number(quote.cryptoAmount) + Number(quote.fee)
      : quote.amountPaid;

  return (
    <div className="flex items-center gap-2">
      <div className="size-12 rounded-full relative">
        <Image src={cryptoLogo!} alt={quote.cryptoType} fill />
      </div>
      {amount && (
        <h2 className="text-white text-lg font-medium">
          {Number(amount).toFixed(2)} {quote.cryptoType}
        </h2>
      )}
    </div>
  );
};

export default AssetAvator;
