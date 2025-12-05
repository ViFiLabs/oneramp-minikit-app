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
} from "lucide-react";

interface SwipeToPayButtonProps {
  onPaymentComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stepMessage?: string;
  disabledMessage?: string; // Add specific disabled message
  reset?: boolean; // Add reset prop to trigger rollback
}

export function SwipeToPayButton({
  onPaymentComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
  disabledMessage = "Complete Form",
  reset = false,
}: SwipeToPayButtonProps) {
  // Trigger completion once user drags past 65% of the track
  const COMPLETION_THRESHOLD = 0.55;
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const haptics = useHaptics();

  const getButtonText = () => {
    if (isLoading && stepMessage) return stepMessage;
    if (disabled) return disabledMessage;
    return "Swipe to Pay";
  };

  const getHelperText = () => {
    if (disabled) return "Complete the form to enable payment";
    if (isLoading) return "Please wait while we process your request...";
    return "Drag the slider to confirm payment";
  };

  const getCaretContent = () => {
    if (isLoading) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
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
          {stepMessage === "Setting up payment..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <CreditCard className="w-5 h-5 animate-pulse text-white" />
              <h3>Setting up payment...</h3>
            </div>
          )}
          {stepMessage === "Opening in Wallet..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Wallet className="w-5 h-5 animate-pulse text-white" />
              <h3>Opening in Wallet...</h3>
            </div>
          )}
          {stepMessage === "Payment Complete!" && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Check className="w-5 h-5 text-white" />
              <h3>Payment Complete!</h3>
            </div>
          )}
          {/* Fallback for any other step message */}
          {stepMessage &&
            stepMessage !== "Checking rates..." &&
            stepMessage !== "Setting up payment..." &&
            stepMessage !== "Opening in Wallet..." &&
            stepMessage !== "Payment Complete!" && (
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
    if (disabled || isLoading) return;
    setIsDragging(true);
    e.preventDefault();
    haptics.light();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isLoading) return;
    setIsDragging(true);
    e.preventDefault();
    haptics.light();
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
          haptics.success();
          onPaymentComplete();
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
          onPaymentComplete();
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
  }, [isDragging, isCompleted, onPaymentComplete, haptics]);

  // Reset when loading changes
  useEffect(() => {
    if (!isLoading) {
      setIsCompleted(false);
      setDragX(0);
    }
  }, [isLoading]);

  // Reset when reset prop changes
  useEffect(() => {
    if (reset) {
      setIsCompleted(false);
      setDragX(0);
      setIsDragging(false);
    }
  }, [reset]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative rounded-full h-16 flex items-center justify-center overflow-hidden cursor-pointer select-none ${
          disabled && !isLoading ? "opacity-80" : ""
        }`}
        style={{
          background: disabled
            ? "linear-gradient(135deg, #6b7280, #4b5563)"
            : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow: disabled ? "none" : "0 4px 12px rgba(59, 130, 246, 0.3)",
        }}
      >
        {/* Background overlay that fills as dragged */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(64, dragX + 64)}px`,
            background: "linear-gradient(135deg, #2563eb, #1e40af)",
            opacity: dragX > 0 ? 0.7 : 0,
          }}
        />

        {/* Main text */}
        <div className="text-white z-10 pointer-events-none flex items-center gap-2 font-medium text-base">
          {getMainText()}
        </div>

        {/* Draggable caret */}
        <div
          className="absolute bg-white rounded-full flex items-center justify-center z-20 shadow-lg w-12 h-12 transition-all duration-300 ease-out"
          style={{
            left: `${8 + dragX}px`,
            transform: isDragging ? "scale(1.05)" : "scale(1)",
            cursor:
              disabled || isLoading
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
      <div className="text-center text-gray-400 text-xs mt-1">
        <p>{getHelperText()}</p>
      </div>
    </div>
  );
}
