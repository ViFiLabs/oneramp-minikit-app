"use client";

import React from "react";
import { ArrowLeftRight } from "lucide-react";

interface SwapButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
}

export function SwapButton({ 
  onClick, 
  disabled = false, 
  text = "Swap" 
}: SwapButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-full h-16 flex items-center justify-center gap-3 font-medium text-lg transition-all duration-300 ${
          disabled 
            ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50" 
            : "bg-gradient-to-r from-[#7B68EE] to-[#6A5ACD] text-white hover:from-[#6A5ACD] hover:to-[#5A4FCF] shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        }`}
        // style={{
        //   boxShadow: disabled 
        //     ? "none" 
        //     : "0 4px 12px rgba(123, 104, 238, 0.3)"
        // }}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span>{text}</span>
      </button>
    </div>
  );
}
