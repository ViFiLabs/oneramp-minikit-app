import { Button } from "@/components/ui/button";
import { useNetworkStore } from "@/store/network";
import { Network } from "@/types";
import Image from "next/image";

export function NetworkSelectModal({
  open,
  onClose,
  networks,
  onSelect,
  canSwitch,
}: {
  open: boolean;
  onClose: () => void;
  networks: Network[];
  selectedNetwork: Network;
  onSelect: (network: Network) => void;
  canSwitch?: (network: Network) => boolean;
}) {
  const { currentNetwork } = useNetworkStore();

  if (!open) return null;

  return (
    <div className="min-h-screen fixed inset-0 z-40 flex items-center justify-center backdrop-blur-xs">
      <div className="bg-[#232323] rounded-2xl p-5 min-w-[350px] shadow-2xl relative">
        <Button
          variant="ghost"
          className="absolute top-2 right-2 text-neutral-400 hover:text-white"
          onClick={onClose}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Button>
        <div className="text-lg text-white font-semibold mb-4">
          Select Network
        </div>
        <div className="flex flex-col gap-5">
          {networks.map((n) => {
            // const isSelected = selectedNetwork.name === n.name;
            const isSelected = currentNetwork?.chainId === n.chainId;
            const hasRequiredWallet = !canSwitch || canSwitch(n);
            return (
              <Button
                key={n.name}
                variant="ghost"
                className={`flex items-center justify-between w-full h-14   rounded-xl transition-colors ${
                  isSelected ? "bg-[#353535]" : "hover:bg-[#353535]"
                }`}
                onClick={() => onSelect(n)}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={n.logo}
                    alt={n.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium text-base">
                    {n.name}
                  </span>
                </div>
                {hasRequiredWallet && isSelected && (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#bcbcff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
