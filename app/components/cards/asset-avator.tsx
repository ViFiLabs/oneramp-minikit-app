import { assets } from "@/data/currencies";
import Image from "next/image";
import React from "react";

const AssetAvator = ({
  cryptoType,
  cryptoAmount,
  iconOnly,
}: {
  cryptoType: string;
  cryptoAmount: string;
  iconOnly?: boolean;
}) => {
  const cryptoLogo = assets.find((asset) => asset.symbol === cryptoType)?.logo;
  if (iconOnly) {
    return <Image src={cryptoLogo!} alt={cryptoType} fill />;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="size-12 rounded-full relative">
        <Image src={cryptoLogo!} alt={cryptoType} fill />
      </div>
      <span className="text-white text-lg font-medium">
        {cryptoAmount} {cryptoType}
      </span>
    </div>
  );
};

export default AssetAvator;
