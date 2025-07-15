"use client";

import { Button } from "@/components/ui/button";
import { assets } from "@/data/currencies";
import { useUserSelectionStore } from "@/store/user-selection";
import { Asset } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface CurrencySelectorProps {
  selectedCurrency: Asset;
  onCurrencyChange: (currency: Asset) => void;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  className = "",
}: CurrencySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { updateSelection } = useUserSelectionStore();

  const handleCurrencySelect = async (currency: Asset) => {
    await Promise.all([
      onCurrencyChange(currency),
      updateSelection({ asset: currency }),
    ]);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="default"
        className="flex items-center gap-2 bg-[#232323] border-none px-3 md:px-4 py-2 rounded-full min-w-[80px] md:min-w-[90px]"
        onClick={() => setShowDropdown((v) => !v)}
        type="button"
      >
        <Image
          src={selectedCurrency.logo}
          alt={selectedCurrency.symbol}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-white text-sm md:text-base font-medium">
          {selectedCurrency.symbol}
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
      </Button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="absolute left-0 mt-2 w-full bg-[#232323] rounded-2xl shadow-lg z-30 border border-[#6b6b6b]"
            style={{ minWidth: 150 }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {assets.map((currency, index) => (
              <motion.button
                key={currency.symbol}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors gap-3 ${
                  selectedCurrency.symbol === currency.symbol
                    ? "bg-[#353545]"
                    : "hover:bg-[#23232f]"
                }`}
                onClick={() => handleCurrencySelect(currency)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-3">
                  <Image
                    src={currency.logo}
                    alt={currency.symbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium text-lg">
                    {currency.symbol}
                  </span>
                </span>
                {selectedCurrency.symbol === currency.symbol && (
                  <motion.svg
                    width="22"
                    height="22"
                    fill="none"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#bcbcff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
