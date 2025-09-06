"use client";

import { useUserSelectionStore } from "@/store/user-selection";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  VisuallyHidden,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { cNGNTabsUI } from "./utils";
import { Globe, HandCoins, Landmark } from "lucide-react";
import Image from "next/image";

type CngnAction = "fiat_withdrawal" | "onchain_transfer";

const ACTIONS: { value: CngnAction; label: string; description: string }[] = [
  {
    value: "fiat_withdrawal",
    label: "Withdraw to bank or mobile money",
    description: "Off-ramp cNGN to NGN via supported institutions",
  },
  {
    value: "onchain_transfer",
    label: "Send onchain",
    description: "Transfer cNGN directly to a wallet address",
  },
];

export default function SelectCNGNAction() {
  const { cngnAction, updateSelection } = useUserSelectionStore();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const activeTab = (
      useUserSelectionStore.getState() as unknown as {
        cngnActiveTab?: keyof typeof cNGNTabsUI;
      }
    ).cngnActiveTab;
    if (activeTab) {
      switch (activeTab) {
        case "deposit":
          return "Get cNGN via Bank";
        case "withdraw":
          return "Withdraw to Bank";
        case "swapToUSDC":
          return "Swap for USDC";
        case "swapTocNGN":
          return "Swap for cNGN";
        case "payWithcNGN":
          return "Pay with cNGN";
        case "payGlobally":
          return "Pay globally";
        default:
          break;
      }
    }
    const found = ACTIONS.find((a) => a.value === cngnAction);
    return found ? found.label : "Select cNGN action";
  }, [cngnAction]);

  const handleOpenTab = (tab: keyof typeof cNGNTabsUI) => {
    // Persist active tab to global selection so SwapPanel can render it
    updateSelection({ cngnActiveTab: tab } as unknown as Record<
      string,
      unknown
    >);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-left !bg-[#232323] border !border-[#3a3a3a]/40 hover:bg-[#212121] text-neutral-300 rounded-xl h-14 px-6 flex items-center justify-between transition-colors"
        >
          <span className="text-base font-medium text-neutral-200">
            {selectedLabel}
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            className="text-neutral-400"
          >
            <path
              d="M7 10l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg fixed inset-0 z-40" />
        <DialogPrimitive.Content
          className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 shadow-2xl overflow-hidden
          bottom-0 left-0 right-0 w-full rounded-t-2xl animate-slide-up-smooth
          md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200 md:transform desktop-modal-center"
          style={{
            padding: 0,
            height: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select cNGN action</DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232323]">
            <h2 className="text-xl font-medium text-white">
              Select cNGN action
            </h2>
            <DialogPrimitive.Close className="text-neutral-400 hover:text-white transition-colors">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="px-6 py-6 grid gap-6">
            <Button
              onClick={() => handleOpenTab("deposit")}
              className="w-full flex items-center justify-start hover:!bg-neutral-800 gap-6 px-4  rounded-lg h-14 transition-colors"
            >
              <Landmark className="size-6" />
              <h1 className="text-white/90 text-base font-medium">
                Get cNGN via Bank
              </h1>
            </Button>

            <Button
              onClick={() => handleOpenTab("withdraw")}
              className="w-full flex items-center justify-start hover:!bg-neutral-800 gap-6  px-4 rounded-lg h-14 transition-colors"
            >
              <Landmark className="size-6" />
              <h1 className="text-white/90 text-base font-medium">
                Withdraw to Bank
              </h1>
            </Button>

            <Button
              onClick={() => handleOpenTab("swapToUSDC")}
              className="w-full flex items-center justify-start hover:!bg-neutral-800 gap-3  px-4   rounded-lg h-14 transition-colors"
            >
              <Image
                src="/logos/cngn-to-usdc.png"
                alt="USDC"
                width={38}
                height={38}
              />
              <h1 className="text-white/90 text-base font-medium">
                Swap for USDC
              </h1>
            </Button>

            <Button
              onClick={() => handleOpenTab("swapTocNGN")}
              className="w-full flex items-center justify-start hover:!bg-neutral-800 gap-3  px-4   rounded-lg h-14 transition-colors"
            >
              <Image
                src="/logos/cngn-to-usdc.png"
                alt="USDC"
                width={38}
                height={38}
              />
              <h1 className="text-white/90 text-base font-medium">
                Swap for cNGN
              </h1>
            </Button>

            <Button
              onClick={() => handleOpenTab("payWithcNGN")}
              className="w-full flex items-center justify-start hover:!bg-neutral-800 gap-6  px-4 rounded-lg h-14 transition-colors"
            >
              <HandCoins className="size-6" />
              <h1 className="text-white/90 text-base font-medium">
                Pay with cNGN
              </h1>
            </Button>
            <Button
              onClick={() => handleOpenTab("payGlobally")}
              className="w-full flex items-center justify-start gap-6 hover:!bg-neutral-800   px-4 rounded-lg h-14 transition-colors"
            >
              <Globe className="size-6" />
              <h1 className="text-white/90 text-base font-medium ">
                Pay globally
              </h1>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
