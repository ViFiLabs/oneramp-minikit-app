import { Button } from "@/components/ui/button";
import { Asset, Network } from "@/types";
import Image from "next/image";

const AssetCard = ({
  token,
  network,
  handleTokenSelect,
}: {
  token: Asset;
  network: Network;
  handleTokenSelect: (token: Asset, network: Network) => void;
}) => {
  return (
    <Button
      key={`${token.symbol}-${network.name}`}
      variant="ghost"
      className="flex items-center my-4 rounded-none justify-between w-full py-8 hover:bg-[#3a4155] transition-colors border-b border-[#3a4155] last:border-0"
      onClick={() => handleTokenSelect(token, network)}
    >
      <div className="flex items-center gap-3 px-2 w-full flex-1">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="size-10 rounded-full relative overflow-hidden">
              <Image
                src={token.logo}
                alt={token.symbol}
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full overflow-hidden border-2 border-[#232323]">
              <Image
                src={network.logo}
                alt={network.name}
                width={20}
                height={20}
                className="rounded-full"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">{token.name}</div>
            <div className="text-neutral-400 text-sm">
              <p className="text-xs">{token.symbol}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-400">on {network.name}</p>
    </Button>
  );
};

export default AssetCard;
