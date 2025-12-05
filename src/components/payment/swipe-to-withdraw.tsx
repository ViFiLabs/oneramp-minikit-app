"use client";

import React, { useState, useRef, useEffect } from "react";
import { useHaptics } from "@/src/hooks/useHaptics";
import {
  ChevronRight,
  Loader2,
  CreditCard,
  Wallet,
  Check,
  ArrowLeftRight,
  Blend,
  ArrowUpDown,
} from "lucide-react";

interface SwipeToWithdrawButtonProps {
  onWithdrawComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stepMessage?: string;
  onSwapClick?: () => void;
  isWalletConnected?: boolean;
  hasKYC?: boolean;
  onConnectWallet?: () => void;
  onStartKYC?: () => void;
  reset?: boolean; // Add reset prop to trigger rollback
}

export function SwipeToWithdrawButton({
  onWithdrawComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
  isWalletConnected = false,
  hasKYC = false,
  onConnectWallet,
  // onStartKYC,
  reset = false,
}: SwipeToWithdrawButtonProps) {
  // Trigger completion once user drags past ~55% of the track (mobile-friendly)
  const COMPLETION_THRESHOLD = 0.55;
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const haptics = useHaptics();

  // Reset button state when reset prop changes
  useEffect(() => {
    if (reset) {
      setIsDragging(false);
      setDragX(0);
      setIsCompleted(false);
    }
  }, [reset]);

  const getButtonText = () => {
    if (isLoading && stepMessage) return stepMessage;

    // Check wallet connection
    if (!isWalletConnected) return "Connect Wallet";

    // Always show "Swipe to Withdraw" if wallet is connected, regardless of KYC status
    return "Swipe to Withdraw";
  };

  const getHelperText = () => {
    if (isLoading) return "Please wait while we process your request...";

    // Check wallet connection
    if (!isWalletConnected) return "Connect your wallet to continue";

    // Always show withdrawal-related helper text, regardless of KYC status
    if (disabled) return "Complete form details to continue";
    return "Drag the slider to confirm withdrawal";
  };

  const getCaretContent = () => {
    if (stepMessage === "Transaction Complete!") {
      return <Check className="w-5 h-5 text-green-600" />;
    }
    if (isLoading) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    if (!isWalletConnected) {
      return <Wallet className="w-5 h-5 text-blue-600" />;
    }
    if (isWalletConnected && !hasKYC) {
      return <CreditCard className="w-5 h-5 text-blue-600" />;
    }
    return <ChevronRight className="w-5 h-5 text-blue-600" />;
  };

  const getMainText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          {stepMessage === "Checking rates..." && (
            <div className="flex items-center text-sm  gap-2 flex-row justify-center">
              <ArrowLeftRight className="w-5 h-5 animate-pulse text-white" />
              <h3>Checking rates...</h3>
            </div>
          )}
          {stepMessage === "Setting up withdrawal..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <ArrowUpDown className="w-5 h-5 animate-pulse text-white" />
              <h3>Setting up withdrawal...</h3>
            </div>
          )}
          {stepMessage === "Opening in Wallet..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Wallet className="w-5 h-5 animate-pulse text-white" />
              <h3>Opening in Wallet...</h3>
            </div>
          )}
          {stepMessage === "Transaction Complete!" && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Check className="w-5 h-5 text-white" />
              <h3>Transaction Complete!</h3>
            </div>
          )}
          {/* Fallback for any other step message */}
          {stepMessage &&
            stepMessage !== "Checking rates..." &&
            stepMessage !== "Setting up withdrawal..." &&
            stepMessage !== "Opening in Wallet..." &&
            stepMessage !== "Transaction Complete!" && (
              <div className="flex items-center text-sm gap-2 flex-row justify-center">
                <Blend className="w-5 h-5 animate-pulse text-white" />
                <h3>{stepMessage}</h3>
              </div>
            )}
        </div>
      );
    }
    return <span className="text-sm">{getButtonText()}</span>;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading) return;

    // Handle wallet connection
    if (!isWalletConnected) {
      onConnectWallet?.();
      return;
    }

    // Allow dragging when wallet is connected (regardless of KYC status)
    // Only block if disabled (form incomplete)
    if (isWalletConnected && !disabled) {
      setIsDragging(true);
      if (e.cancelable) {
        e.preventDefault();
      }
      haptics.light(); // subtle tap on swipe start
      return;
    }

    // For disabled state (form incomplete)
    if (disabled) return;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading) return;

    // Handle wallet connection
    if (!isWalletConnected) {
      onConnectWallet?.();
      return;
    }

    // Allow dragging when wallet is connected (regardless of KYC status)
    // Only block if disabled (form incomplete)
    if (isWalletConnected && !disabled) {
      setIsDragging(true);
      if (e.cancelable) {
        e.preventDefault();
      }
      haptics.light(); // subtle tap on swipe start
      return;
    }

    // For disabled state (form incomplete)
    if (disabled) return;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = 48; // w-12 = 48px
      const maxPossibleDrag = rect.width - handleWidth;
      const maxAllowedDrag = maxPossibleDrag * 0.8; // Limit to 80% of slider width
      const newX = Math.max(
        0,
        Math.min(maxAllowedDrag, e.clientX - rect.left - handleWidth / 2)
      );
      setDragX(newX);

      if (newX >= maxAllowedDrag * COMPLETION_THRESHOLD) {
        setIsCompleted(true);
        // Smoothly assist the handle to 80% position for better UX
        setDragX(maxAllowedDrag);
        setIsDragging(false);
        setTimeout(() => {
          // Always call onWithdrawComplete when swipe is completed
          // Let the parent component handle KYC verification
          haptics.success(); // completion haptic
          onWithdrawComplete();
        }, 300);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = 48; // w-12 = 48px
      const maxPossibleDrag = rect.width - handleWidth;
      const maxAllowedDrag = maxPossibleDrag * 0.8; // Limit to 80% of slider width
      const touch = e.touches[0];
      const newX = Math.max(
        0,
        Math.min(maxAllowedDrag, touch.clientX - rect.left - handleWidth / 2)
      );
      setDragX(newX);

      if (newX >= maxAllowedDrag * COMPLETION_THRESHOLD) {
        setIsCompleted(true);
        // Smoothly assist the handle to 80% position for better UX
        setDragX(maxAllowedDrag);
        setIsDragging(false);
        setTimeout(() => {
          // Always call onWithdrawComplete when swipe is completed
          // Let the parent component handle KYC verification
          haptics.success(); // completion haptic
          onWithdrawComplete();
        }, 300);
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isCompleted) {
        setDragX(0);
      }
      setIsDragging(false);
    };

    const handleGlobalTouchEnd = () => {
      if (!isCompleted) {
        setDragX(0);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isDragging, isCompleted, onWithdrawComplete, isWalletConnected, haptics]);

  // Reset when loading changes or when KYC/wallet state changes
  useEffect(() => {
    if (!isLoading) {
      setIsCompleted(false);
      setDragX(0);
    }
  }, [isLoading, isWalletConnected]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative rounded-full h-16 flex items-center justify-center overflow-hidden cursor-pointer select-none ${
          !isWalletConnected || disabled ? "opacity-50" : ""
        }`}
        style={{
          background:
            !isWalletConnected || disabled
              ? "linear-gradient(135deg, #6b7280, #4b5563)"
              : stepMessage === "Transaction Complete!"
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow:
            !isWalletConnected || disabled
              ? "none"
              : stepMessage === "Transaction Complete!"
              ? "0 4px 12px rgba(16, 185, 129, 0.3)"
              : "0 4px 12px rgba(59, 130, 246, 0.3)",
        }}
      >
        {/* Background overlay that fills as dragged */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(64, dragX + 64)}px`,
            background:
              stepMessage === "Transaction Complete!"
                ? "linear-gradient(135deg, #059669, #047857)"
                : "linear-gradient(135deg, #2563eb, #1e40af)",
            opacity: dragX > 0 ? 0.7 : 0,
          }}
        />

        {/* Main text */}
        <div className="text-white z-10 pointer-events-none flex items-center gap-2 font-medium text-lg">
          {getMainText()}
        </div>

        {/* Draggable caret */}
        <div
          className="absolute bg-white rounded-full flex items-center justify-center z-20 shadow-lg w-12 h-12 transition-all duration-300 ease-out"
          style={{
            left: `${8 + dragX}px`,
            transform: isDragging ? "scale(1.05)" : "scale(1)",
            cursor: isLoading
              ? "not-allowed"
              : !isWalletConnected
              ? "pointer"
              : disabled
              ? "not-allowed"
              : isDragging
              ? "grabbing"
              : "grab",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {getCaretContent()}
        </div>
      </div>

      {/* Helper text */}
      <div className="text-center text-gray-400 text-sm mt-3">
        <p>{getHelperText()}</p>
      </div>
    </div>
  );
}
