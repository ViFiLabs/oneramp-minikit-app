"use client";

import { Button } from "@/components/ui/button";
import { PAY_SUPPORTED_COUNTRIES } from "@/data/countries";
import { Quote, Transfer } from "@/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

interface BuyStatusCardProps {
  quote: Quote;
  transfer?: Transfer;
  isProcessing: boolean;
  isFailed?: boolean;
  isSuccess?: boolean;
  onDone: () => void;
  onClose?: () => void;
  animationPhase?: "initial" | "transition" | "final";
}

const BuyStatusCard: React.FC<BuyStatusCardProps> = ({
  quote,
  isProcessing,
  isFailed = false,
  isSuccess = false,
  onDone,
  onClose,
  animationPhase = "initial",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleDoneInternal = useCallback(() => {
    onDone();
  }, [onDone]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        handleDoneInternal();
      }
    }, 300);
  }, [onClose, handleDoneInternal]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const currentY = e.clientY;
      setDragCurrentY(currentY);
      const deltaY = Math.max(0, currentY - dragStartY);
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;
      const deltaY = dragCurrentY - dragStartY;
      if (deltaY > 100) {
        handleClose();
      } else {
        if (modalRef.current) {
          modalRef.current.style.transform = "translateY(0px)";
        }
      }
      setIsDragging(false);
      setDragStartY(0);
      setDragCurrentY(0);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStartY, dragCurrentY, handleClose]);

  const isPaySupportedCountry = PAY_SUPPORTED_COUNTRIES.some(
    (c) => c.countryCode === quote.country
  );
  const totalAmount = isPaySupportedCountry
    ? Number(quote.fiatAmount)
    : Number(quote.fiatAmount) + Number(quote.feeInFiat);

  const cryptoAmount = Number(quote.cryptoAmount);
  const fiatAmount = totalAmount;

  // handleDoneInternal defined above

  // handleClose is defined above with useCallback

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    setDragCurrentY(currentY);
    const deltaY = Math.max(0, currentY - dragStartY);
    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };
  const handleTouchEnd = () => {
    if (!isDragging) return;
    const deltaY = dragCurrentY - dragStartY;
    if (deltaY > 100) {
      handleClose();
    } else {
      if (modalRef.current) {
        modalRef.current.style.transform = "translateY(0px)";
      }
    }
    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragStartY(e.clientY);
    setDragCurrentY(e.clientY);
    setIsDragging(true);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
        <div
          ref={modalRef}
          className={`bg-gray-900 rounded-t-3xl w-full h-[60vh] overflow-hidden transition-all duration-300 ease-out shadow-2xl ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            transition: isDragging ? "none" : "transform 300ms ease-out",
          }}
        >
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-1 bg-gray-500 rounded-full"></div>
          </div>

          <div
            className="flex justify-end p-4 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors z-10"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <FiX size={16} color="#ffffff" />
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col items-center space-y-6 flex-1 justify-center">
            <div className="flex items-center justify-center min-h-[80px]">
              {isProcessing ? (
                <div
                  className={`flex justify-center items-center gap-4 transition-all duration-500 ${
                    animationPhase === "transition"
                      ? "opacity-50 scale-90"
                      : "opacity-100 scale-100"
                  }`}
                >
                  <div
                    className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : isFailed ? (
                <div
                  className={`w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transform transition-all duration-500 ${
                    animationPhase === "final"
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                >
                  <FiX size={24} color="#ffffff" />
                </div>
              ) : isSuccess ? (
                <div
                  className={`w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center transform transition-all duration-500 ${
                    animationPhase === "final"
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                >
                  <FiCheck size={24} color="#ffffff" />
                </div>
              ) : (
                <div
                  className={`w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center transform transition-all duration-500 ${
                    animationPhase === "final"
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                >
                  <FiCheck size={24} color="#ffffff" />
                </div>
              )}
            </div>

            <h1
              className={`text-xl font-semibold text-center text-white transition-all duration-300 ${
                isProcessing ? "opacity-70" : "opacity-100"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : isFailed
                ? "Transaction Failed"
                : isSuccess
                ? "Transaction Successful"
                : "Transaction Successful"}
            </h1>

            <div className="text-center">
              <p className="text-white text-center text-lg font-medium">
                {`${cryptoAmount.toFixed(1)} ${
                  quote.cryptoType
                } for ${fiatAmount.toFixed(0)} ${quote.fiatType} on ${
                  quote.network.charAt(0).toUpperCase() + quote.network.slice(1)
                }`}
              </p>
            </div>

            {!isProcessing && (
              <div
                className={`w-full transform transition-all duration-500 ${
                  animationPhase === "final"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                <Button
                  onClick={handleDoneInternal}
                  className={`w-full text-white text-lg font-semibold h-14 rounded-full transition-all duration-300 ${
                    isFailed
                      ? "bg-red-500 hover:bg-red-600"
                      : isSuccess
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  }`}
                >
                  {isFailed ? "Try Again" : "Done"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyStatusCard;
