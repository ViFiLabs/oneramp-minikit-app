import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Calculator,
  CreditCard,
  Wallet,
  Check,
} from "lucide-react";

interface SwipeToPayButtonProps {
  onPaymentComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stepMessage?: string;
}

export function SwipeToPayButton({
  onPaymentComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
}: SwipeToPayButtonProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  // Reset component state when loading changes
  useEffect(() => {
    if (!isLoading) {
      setIsCompleted(false);
      setDragProgress(0);
    }
  }, [isLoading]);

  const handleDragEnd = (
    _event: PointerEvent,
    info: { offset: { x: number } }
  ) => {
    if (disabled || isLoading) return;

    const threshold = 200; // Minimum drag distance to complete

    if (info.offset.x >= threshold) {
      setIsCompleted(true);
      setDragProgress(1);
      setTimeout(() => {
        onPaymentComplete();
      }, 500);
    } else {
      setDragProgress(0);
    }
  };

  const handleDrag = (
    _event: PointerEvent,
    info: { offset: { x: number } }
  ) => {
    if (disabled || isLoading) return;

    const maxDrag = 240; // Maximum drag distance
    const progress = Math.min(Math.max(info.offset.x / maxDrag, 0), 1);
    setDragProgress(progress);
  };

  const getBackgroundColor = () => {
    if (disabled) return "#6b7280"; // gray-500
    if (isLoading || isCompleted) return "#10b981"; // green-500
    return "#2563eb"; // blue-600
  };

  const getButtonText = () => {
    if (isLoading && stepMessage) return stepMessage;
    if (isCompleted) return "Payment Complete!";
    if (disabled) return "Complete Form";
    return "Swipe to Pay";
  };

  const getHelperText = () => {
    if (disabled) return "Complete the form to enable payment";
    if (isLoading) return "Please wait while we process your request...";
    return "Drag the slider to confirm payment";
  };

  return (
    <div className="relative">
      <motion.div
        className={`relative rounded-full h-14 flex items-center justify-center overflow-hidden ${
          disabled ? "opacity-50" : ""
        }`}
        animate={{
          backgroundColor: getBackgroundColor(),
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full" />

        {/* Progress background */}
        <motion.div
          className="absolute inset-0 bg-blue-700 rounded-full origin-left"
          style={{
            scaleX: dragProgress,
          }}
        />

        {/* Text */}
        <motion.div
          className="text-white z-10 pointer-events-none flex items-center gap-2"
          animate={{
            opacity: isCompleted ? 0 : 1 - dragProgress * 0.5,
          }}
        >
          {isLoading ? (
            <>
              {stepMessage === "Checking rates..." && (
                <>
                  <Calculator className="w-5 h-5 animate-spin" />
                  <span>Checking rates...</span>
                </>
              )}
              {stepMessage === "Setting up payment..." && (
                <>
                  <CreditCard className="w-5 h-5 animate-pulse" />
                  <span>Setting up payment...</span>
                </>
              )}
              {stepMessage === "Opening in Wallet..." && (
                <>
                  <Wallet className="w-5 h-5 animate-bounce" />
                  <span>Opening in Wallet...</span>
                </>
              )}
              {stepMessage === "Payment Complete!" && (
                <>
                  <Check className="w-5 h-5" />
                  <span>Payment Complete!</span>
                </>
              )}
            </>
          ) : (
            <span>{getButtonText()}</span>
          )}
        </motion.div>

        {/* Drag handle */}
        <motion.div
          className={`absolute left-1 bg-white rounded-full flex items-center justify-center z-20 shadow-lg ${
            disabled || isLoading
              ? "cursor-not-allowed opacity-70"
              : "cursor-grab active:cursor-grabbing"
          }`}
          drag={disabled || isLoading ? false : "x"}
          dragConstraints={{ left: 0, right: 240 }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={{
            x: isCompleted || isLoading ? 240 : 0,
            width: 48,
            height: 48,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          whileDrag={disabled || isLoading ? {} : { scale: 1.1 }}
        >
          {isLoading ? (
            // Simple loading spinner in handle
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : isCompleted ? (
            // Completed state
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : (
            // Default state with rotation based on drag progress
            <motion.div
              animate={{
                rotate: dragProgress * 180,
              }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight
                className={`w-6 h-6 ${
                  disabled ? "text-gray-400" : "text-blue-600"
                }`}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Shine effect - only when not disabled */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
            animate={{
              x: [-100, 300],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        )}
      </motion.div>

      {/* Helper text */}
      <div className="text-center text-gray-400 text-xs md:text-sm mt-2">
        <p>{getHelperText()}</p>
      </div>
    </div>
  );
}
