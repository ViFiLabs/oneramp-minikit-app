"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface WalletTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectWalletType: (type: "evm" | "starknet") => void;
}

export function WalletTypeModal({
  open,
  onClose,
  onSelectWalletType,
}: WalletTypeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#181818] rounded-3xl p-8 w-[420px] shadow-2xl relative border border-[#232323]">
        <button
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-[#232323] transition-colors"
          onClick={onClose}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="text-2xl text-white font-semibold mb-2">
          Connect Wallet
        </div>
        <p className="text-neutral-400 text-sm mb-6">
          Choose your preferred wallet type to continue
        </p>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => onSelectWalletType("evm")}
            className="flex justify-start items-center gap-4 w-full h-16   border-[#232323] hover:bg-[#2a2a2a] rounded-2xl transition-all hover:scale-[1.02] border  hover:border-[#353535] group"
          >
            <div className="p-2 bg-[#353535] rounded-lg group-hover:bg-[#454545] transition-colors">
              <Image
                src="/logos/ethereum.png"
                alt="EVM"
                width={24}
                height={24}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-white font-medium text-base">
                EVM Wallet
              </span>
              <span className="text-neutral-400 text-xs">
                MetaMask, WalletConnect, etc.
              </span>
            </div>
          </Button>

          <Button
            onClick={() => onSelectWalletType("starknet")}
            className="flex justify-start items-center  gap-4 w-full h-16  border-[#232323] hover:bg-[#2a2a2a] rounded-2xl transition-all hover:scale-[1.02] border  hover:border-[#353535] group"
          >
            <div className="p-2 bg-[#353535] rounded-lg group-hover:bg-[#454545] transition-colors">
              <Image
                src="/logos/starknet.png"
                alt="Starknet"
                width={24}
                height={24}
                className="rounded-lg"
              />
            </div>

            <div className="flex flex-col items-start">
              <span className="text-white font-medium text-base">
                Starknet Wallet
              </span>
              <span className="text-neutral-400 text-xs">
                Argent X, Braavos
              </span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
