"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, ShoppingCart, Check } from "lucide-react";

interface SwipeToBuyButtonProps {
  onBuyComplete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stepMessage?: string;
  reset?: boolean;
}

export function SwipeToBuyButton({
  onBuyComplete,
  isLoading = false,
  disabled = false,
  stepMessage = "Processing...",
  reset = false,
}: SwipeToBuyButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reset) {
      setIsDragging(false);
      setDragX(0);
      setIsCompleted(false);
    }
  }, [reset]);

  const getCaretContent = () => {
    if (stepMessage === "Transaction Complete!") {
      return <Check className="w-5 h-5 text-green-600" />;
    }
    if (isLoading) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    return <ChevronRight className="w-5 h-5 text-blue-600" />;
  };

  const getMainText = () => {
    if (isLoading) {
      return <span className="text-sm">{stepMessage || "Processing..."}</span>;
    }
    return (
      <div className="flex items-center gap-2 text-sm">
        <ShoppingCart className="w-5 h-5" />
        <span>Swipe to Buy</span>
      </div>
    );
  };

  const handleStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (isLoading || disabled) return;
    setIsDragging(true);
    // Prevent scroll during touch-drag
    if ((e as React.TouchEvent).cancelable) {
      (e as React.TouchEvent).preventDefault();
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = 48;
      const maxDrag = rect.width - handleWidth;
      const newX = Math.max(
        0,
        Math.min(maxDrag, clientX - rect.left - handleWidth / 2)
      );
      setDragX(newX);
      if (newX > maxDrag * 0.8) {
        setIsCompleted(true);
        setIsDragging(false);
        setTimeout(() => onBuyComplete(), 300);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onEnd = () => {
      if (!isCompleted) setDragX(0);
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, isCompleted, onBuyComplete]);

  useEffect(() => {
    if (!isLoading) {
      setIsCompleted(false);
      setDragX(0);
    }
  }, [isLoading]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative rounded-full h-16 flex items-center justify-center overflow-hidden cursor-pointer select-none ${
          disabled ? "opacity-50" : ""
        }`}
        style={{
          background:
            stepMessage === "Transaction Complete!"
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #7B68EE, #6A5ACD)",
          boxShadow:
            stepMessage === "Transaction Complete!"
              ? "0 4px 12px rgba(16, 185, 129, 0.3)"
              : "0 4px 12px rgba(123, 104, 238, 0.3)",
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(64, dragX + 64)}px`,
            background:
              stepMessage === "Transaction Complete!"
                ? "linear-gradient(135deg, #059669, #047857)"
                : "linear-gradient(135deg, #6A5ACD, #5A4FCF)",
            opacity: dragX > 0 ? 0.7 : 0,
          }}
        />
        <div className="text-white z-10 pointer-events-none flex items-center gap-2 font-medium text-lg">
          {getMainText()}
        </div>
        <div
          className="absolute bg-white rounded-full flex items-center justify-center z-20 shadow-lg w-12 h-12 transition-all duration-300 ease-out"
          style={{
            left: `${8 + dragX}px`,
            transform: isDragging ? "scale(1.05)" : "scale(1)",
          }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          {getCaretContent()}
        </div>
      </div>
      <div className="text-center text-gray-400 text-sm mt-3">
        <p>
          {isLoading
            ? "Please wait while we process your request..."
            : disabled
            ? "Complete form details to continue"
            : "Drag the slider to confirm purchase"}
        </p>
      </div>
    </div>
  );
}
