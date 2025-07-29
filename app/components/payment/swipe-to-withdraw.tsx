"use client";

import React, { useState, useRef, useEffect } from "react";
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
}

export function SwipeToWithdrawButton({
  onWithdrawComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
  onSwapClick,
  isWalletConnected = false,
  hasKYC = false,
  onConnectWallet,
  onStartKYC,
}: SwipeToWithdrawButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getButtonText = () => {
    if (isLoading && stepMessage) return stepMessage;
    
    // Check wallet connection and KYC status
    if (!isWalletConnected) return "Connect Wallet";
    if (isWalletConnected && !hasKYC) return "Swipe to Complete KYC";
    if (isWalletConnected && hasKYC) return "Swipe to Withdraw";
    
    return "Swipe to Withdraw";
  };

  const getHelperText = () => {
    if (isLoading) return "Please wait while we process your request...";
    
    // Check wallet connection and KYC status
    if (!isWalletConnected) return "Connect your wallet to continue";
    if (isWalletConnected && !hasKYC) return "Complete KYC verification to withdraw";
    if (isWalletConnected && hasKYC && disabled) return "Complete form details to continue";
    if (isWalletConnected && hasKYC) return "Drag the slider to confirm withdrawal";
    
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
    return <span>{getButtonText()}</span>;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading) return;
    
    // Handle different states
    if (!isWalletConnected) {
      onConnectWallet?.();
      return;
    }
    
    // Allow dragging for both KYC and withdrawal states
    if (isWalletConnected && (!hasKYC || (hasKYC && !disabled))) {
      setIsDragging(true);
      if (e.cancelable) {
        e.preventDefault();
      }
      return;
    }
    
    // For disabled withdrawal state (form incomplete)
    if (disabled && isWalletConnected && hasKYC) return;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading) return;
    
    // Handle different states
    if (!isWalletConnected) {
      onConnectWallet?.();
      return;
    }
    
    // Allow dragging for both KYC and withdrawal states
    if (isWalletConnected && (!hasKYC || (hasKYC && !disabled))) {
      setIsDragging(true);
      if (e.cancelable) {
        e.preventDefault();
      }
      return;
    }
    
    // For disabled withdrawal state (form incomplete)
    if (disabled && isWalletConnected && hasKYC) return;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = 48; // w-12 = 48px
      const maxDrag = rect.width - handleWidth;
      const newX = Math.max(
        0,
        Math.min(maxDrag, e.clientX - rect.left - handleWidth / 2)
      );
      setDragX(newX);

      if (newX > maxDrag * 0.8) {
        setIsCompleted(true);
        setIsDragging(false);
        setTimeout(() => {
          // Determine which action to take based on current state
          if (isWalletConnected && !hasKYC) {
            onStartKYC?.();
          } else if (isWalletConnected && hasKYC) {
            onWithdrawComplete();
          }
        }, 300);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = 48; // w-12 = 48px
      const maxDrag = rect.width - handleWidth;
      const touch = e.touches[0];
      const newX = Math.max(
        0,
        Math.min(maxDrag, touch.clientX - rect.left - handleWidth / 2)
      );
      setDragX(newX);

      if (newX > maxDrag * 0.8) {
        setIsCompleted(true);
        setIsDragging(false);
        setTimeout(() => {
          // Determine which action to take based on current state
          if (isWalletConnected && !hasKYC) {
            onStartKYC?.();
          } else if (isWalletConnected && hasKYC) {
            onWithdrawComplete();
          }
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
  }, [isDragging, isCompleted, onWithdrawComplete, onStartKYC, isWalletConnected, hasKYC]);

  // Reset when loading changes or when KYC/wallet state changes
  useEffect(() => {
    if (!isLoading) {
      setIsCompleted(false);
      setDragX(0);
    }
  }, [isLoading, isWalletConnected, hasKYC]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative rounded-full h-16 flex items-center justify-center overflow-hidden cursor-pointer select-none ${
          (!isWalletConnected || (disabled && isWalletConnected && hasKYC)) ? "opacity-50" : ""
        }`}
        style={{
          background: (!isWalletConnected || (disabled && isWalletConnected && hasKYC))
            ? "linear-gradient(135deg, #6b7280, #4b5563)"
            : stepMessage === "Transaction Complete!"
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #7B68EE, #6A5ACD)",
          boxShadow: (!isWalletConnected || (disabled && isWalletConnected && hasKYC))
            ? "none" 
            : stepMessage === "Transaction Complete!"
            ? "0 4px 12px rgba(16, 185, 129, 0.3)"
            : "0 4px 12px rgba(123, 104, 238, 0.3)",
        }}
      >
        {/* Background overlay that fills as dragged */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(64, dragX + 64)}px`,
            background: stepMessage === "Transaction Complete!"
              ? "linear-gradient(135deg, #059669, #047857)"
              : "linear-gradient(135deg, #6A5ACD, #5A4FCF)",
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
            cursor:
              isLoading
                ? "not-allowed"
                : !isWalletConnected
                ? "pointer"
                : (disabled && isWalletConnected && hasKYC)
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