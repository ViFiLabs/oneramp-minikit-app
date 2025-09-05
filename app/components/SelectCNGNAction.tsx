"use client";

import { useUserSelectionStore } from "@/store/user-selection";
import { useMemo, useState } from "react";

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
    const found = ACTIONS.find((a) => a.value === cngnAction);
    return found ? found.label : "Select cNGN action";
  }, [cngnAction]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-transparent border !border-neutral-600 text-white rounded-2xl px-4 py-4 flex items-center justify-between"
      >
        <span className="text-base font-medium text-white">
          {selectedLabel}
        </span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 10l5 5 5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="mt-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          {ACTIONS.map((action) => (
            <button
              key={action.value}
              type="button"
              onClick={() => {
                updateSelection({ cngnAction: action.value });
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-[#262626] transition-colors ${
                cngnAction === action.value ? "bg-[#262626]" : ""
              }`}
            >
              <div className="text-white text-sm font-medium">
                {action.label}
              </div>
              <div className="text-neutral-400 text-xs">
                {action.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
