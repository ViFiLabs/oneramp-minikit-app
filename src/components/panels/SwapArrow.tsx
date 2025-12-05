"use client";

import { ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface SwapArrowProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  double?: boolean; // show double chevrons for swap screens
}

export function SwapArrow({
  onClick,
  disabled = false,
  className = "",
  double = false,
}: SwapArrowProps) {
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) {
      setIsRotating(true);
      onClick();
      // Reset rotation state after animation
      setTimeout(() => setIsRotating(false), 400);
    }
  };

  return (
    <div
      className={`w-full flex justify-center items-center relative z-20 ${className}`}
      style={{ height: 0 }}
    >
      <motion.div
        className={`bg-[#181818] border-4 border-[#232323] rounded-xl p-2 md:p-3 shadow-lg flex items-center justify-center absolute ${
          onClick && !disabled
            ? "cursor-pointer hover:bg-[#232323] transition-colors"
            : ""
        }`}
        style={{
          width: 48,
          height: 48,
          top: -24, // Half of the height to center vertically
          transform: "translateY(-50%)",
        }}
        onClick={handleClick}
        animate={{
          rotate: isRotating ? 180 : 0,
        }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        {double ? (
          <ArrowUpDown className="size-6 text-white" />
        ) : (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 5v14m0 0l-5-5m5 5l5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.div>
    </div>
  );
}
