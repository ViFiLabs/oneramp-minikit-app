"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Loader2,
  Check,
  ArrowLeftRight,
  Wallet,
  RefreshCw,
} from "lucide-react";

interface SwipeToSwapButtonProps {
  onSwapComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stepMessage?: string;
  disabledMessage?: string;
  reset?: boolean;
}

export function SwipeToSwapButton({
  onSwapComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
  disabledMessage = "Complete Form",
  reset = false,
}: SwipeToSwapButtonProps) {
  // Trigger completion once user drags past 55% of the track
  const COMPLETION_THRESHOLD = 0.55;
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getButtonText = () => {
    if (isLoading && stepMessage) return stepMessage;
    if (disabled) return disabledMessage;
    if (stepMessage && stepMessage.toLowerCase().includes('retry')) return "Try Again";
    return "Swipe to Swap";
  };

  const getHelperText = () => {
    if (disabled) return "Complete the form to enable swap";
    if (isLoading) return "Please wait while we process your swap...";
    if (stepMessage && stepMessage.toLowerCase().includes('retry')) return "Drag the slider to retry the swap";
    return "Drag the slider to confirm swap";
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
          {stepMessage === "Checking quote..." && (
            <div className="flex items-center text-sm  gap-2 flex-row justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-white" />
              <h3>Checking quote...</h3>
            </div>
          )}
          {stepMessage === "Approving token..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <ArrowLeftRight className="w-5 h-5 animate-pulse text-white" />
              <h3>Approving token...</h3>
            </div>
          )}
          {stepMessage === "Opening in Wallet..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Wallet className="w-5 h-5 animate-pulse text-white" />
              <h3>Opening in Wallet...</h3>
            </div>
          )}
          {stepMessage === "Swap Complete!" && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <Check className="w-5 h-5 text-white" />
              <h3>Swap Complete!</h3>
            </div>
          )}
          {stepMessage === "Processing swap..." && (
            <div className="flex items-center text-sm gap-2 flex-row justify-center">
              <ArrowLeftRight className="w-5 h-5 animate-pulse text-white" />
              <h3>Processing swap...</h3>
            </div>
          )}
          {/* Fallback for any other step message */}
          {stepMessage &&
            stepMessage !== "Checking quote..." &&
            stepMessage !== "Approving token..." &&
            stepMessage !== "Opening in Wallet..." &&
            stepMessage !== "Swap Complete!" &&
            stepMessage !== "Processing swap..." && (
              <div className="flex items-center text-sm gap-2 flex-row justify-center">
                <ArrowLeftRight className="w-5 h-5 animate-pulse text-white" />
                <h3>{stepMessage}</h3>
              </div>
            )}
        </div>
      );
    }
    
    // Handle retry case when not loading
    if (stepMessage && stepMessage.toLowerCase().includes('retry')) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="w-5 h-5 text-red-400" />
          <span>Try Again</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <ArrowLeftRight className="w-5 h-5" />
        <span>{getButtonText()}</span>
      </div>
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isLoading) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isLoading) return;
    setIsDragging(true);
    e.preventDefault();
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
          onSwapComplete();
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
          onSwapComplete();
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
  }, [isDragging, isCompleted, onSwapComplete]);

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
            : stepMessage && stepMessage.toLowerCase().includes('retry')
            ? "linear-gradient(135deg, #dc2626, #b91c1c)"
            : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow: disabled 
            ? "none" 
            : stepMessage && stepMessage.toLowerCase().includes('retry')
            ? "0 4px 12px rgba(220, 38, 38, 0.3)"
            : "0 4px 12px rgba(59, 130, 246, 0.3)",
        }}
      >
        {/* Background overlay that fills as dragged */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(64, dragX + 64)}px`,
            background: stepMessage && stepMessage.toLowerCase().includes('retry')
              ? "linear-gradient(135deg, #b91c1c, #991b1b)"
              : "linear-gradient(135deg, #2563eb, #1e40af)",
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