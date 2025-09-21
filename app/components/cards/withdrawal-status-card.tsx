"use client";

import { Button } from "@/app/components/ui/button";
import { PAY_SUPPORTED_COUNTRIES } from "@/data/countries";
import { useUserSelectionStore } from "@/store/user-selection";
import { Quote, Transfer } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

interface WithdrawalStatusCardProps {
  quote: Quote;
  transfer?: Transfer;
  isProcessing: boolean;
  isFailed?: boolean;
  isSuccess?: boolean;
  onDone: () => void;
  onClose?: () => void;
  animationPhase?: "initial" | "transition" | "final";
}

const WithdrawalStatusCard: React.FC<WithdrawalStatusCardProps> = ({
  quote,
  isProcessing,
  isFailed = false,
  isSuccess = false,
  onDone,
  onClose,
  animationPhase = "initial",
}) => {
  const { resetToDefault } = useUserSelectionStore();
  const [isVisible, setIsVisible] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [panelBounds, setPanelBounds] = useState<DOMRect | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Detect screen size and panel boundaries
  useEffect(() => {
    const checkScreenSizeAndPanelBounds = () => {
      const isDesktopSize = window.innerWidth >= 768;
      setIsDesktop(isDesktopSize);
      
      // Try to find panel bounds for both desktop and mobile
      // Multiple fallback strategies to find the withdrawPanel container
      let panelContainer: Element | null = null;
      
      // Strategy 1: Look for elements with specific background and rounded styles
      const candidates = Array.from(document.querySelectorAll('div')).filter(el => {
        const styles = window.getComputedStyle(el);
        const classes = el.className;
        return (
          (styles.backgroundColor === 'rgb(24, 24, 24)' || classes.includes('bg-[#181818]')) &&
          (styles.borderRadius === '24px' || classes.includes('rounded-3xl')) &&
          (styles.maxWidth === '448px' || classes.includes('max-w-md') || !isDesktopSize)
        );
      });
      
      if (candidates.length > 0) {
        panelContainer = candidates[0];
        console.log('Found panel via style matching:', panelContainer);
      }
      
      // Strategy 2: Look for withdrawPanel by finding text content
      if (!panelContainer) {
        const swapHeaders = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes('Swap') && 
          el.closest('div[class*="bg-"]')
        );
        if (swapHeaders.length > 0) {
          panelContainer = swapHeaders[0].closest('div[class*="max-w-md"], div[class*="rounded-3xl"]');
          console.log('Found panel via Swap header:', panelContainer);
        }
      }
      
      // Strategy 3: Look for the main content container
      if (!panelContainer) {
        panelContainer = document.querySelector('.max-w-md.mx-auto') ||
                        document.querySelector('[class*="max-w-md"][class*="mx-auto"]') ||
                        document.querySelector('main') ||
                        document.querySelector('[class*="container"]');
        console.log('Found panel via max-w-md selector:', panelContainer);
      }
      
      if (panelContainer) {
        const bounds = panelContainer.getBoundingClientRect();
        setPanelBounds(bounds);
        console.log('Panel bounds detected:', bounds, panelContainer);
      } else {
        console.warn('Panel container not found, using fallback positioning');
        setPanelBounds(null);
      }
    };
    
    checkScreenSizeAndPanelBounds();
    window.addEventListener('resize', checkScreenSizeAndPanelBounds);
    
    // Also check bounds when modal becomes visible (in case DOM changes)
    if (isVisible) {
      setTimeout(checkScreenSizeAndPanelBounds, 100);
    }
    
    return () => window.removeEventListener('resize', checkScreenSizeAndPanelBounds);
  }, [isVisible]);

  // Show modal with animation and prevent body scroll
  useEffect(() => {
    setIsVisible(true);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Global mouse event listeners for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const currentY = e.clientY;
      setDragCurrentY(currentY);

      // Only allow downward dragging
      const deltaY = Math.max(0, currentY - dragStartY);
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;

      const deltaY = dragCurrentY - dragStartY;

      // If dragged down more than 100px, close the modal
      if (deltaY > 100) {
        handleClose();
      } else {
        // Snap back to original position
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
  }, [isDragging, dragStartY, dragCurrentY]);

  // Calculate amounts based on country
  let totalAmount = 0;
  const isPaySupportedCountry = PAY_SUPPORTED_COUNTRIES.some(
    (country) => country.countryCode === quote.country
  );

  if (isPaySupportedCountry) {
    totalAmount = Number(quote.fiatAmount);
  } else {
    totalAmount = Number(quote.fiatAmount) + Number(quote.feeInFiat);
  }

  // For withdrawal (TransferOut), we're swapping crypto for fiat
  const cryptoAmount = Number(quote.cryptoAmount);
  const fiatAmount = totalAmount;

  const handleDone = () => {
    resetToDefault();
    onDone();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        handleDone();
      }
    }, 300); // Wait for animation to complete
  };

  // Touch/drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    setDragCurrentY(currentY);

    // Only allow downward dragging
    const deltaY = Math.max(0, currentY - dragStartY);
    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = dragCurrentY - dragStartY;

    // If dragged down more than 100px, close the modal
    if (deltaY > 100) {
      handleClose();
    } else {
      // Snap back to original position
      if (modalRef.current) {
        modalRef.current.style.transform = "translateY(0px)";
      }
    }

    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragStartY(e.clientY);
    setDragCurrentY(e.clientY);
    setIsDragging(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed transition-opacity duration-300 z-[55] ${
          panelBounds 
            ? 'bg-transparent' 
            : 'inset-0 bg-black bg-opacity-50 md:bg-black/60 md:backdrop-blur-lg'
        } ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
        style={{ 
          position: 'fixed',
          zIndex: 55,
          ...(panelBounds ? {
            // Constrain backdrop to panel area but make it transparent
            left: `${panelBounds.left}px`,
            top: `${panelBounds.top}px`,
            width: `${panelBounds.width}px`,
            height: `${panelBounds.height}px`,
            borderRadius: isDesktop ? '1.5rem' : '1.5rem', // Match panel's rounded-3xl
          } : {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          })
        }}
      />

      {/* Modal */}
      <div 
        className={`fixed z-[60] flex ${
          isDesktop 
            ? panelBounds 
              ? '' 
              : 'items-center justify-center inset-0'
            : panelBounds 
              ? ''
              : 'items-end justify-center inset-0'
        }`}
        style={{ 
          position: 'fixed', 
          zIndex: 60,
          // Use detected panel boundaries on desktop when available
          ...(isDesktop && panelBounds ? {
            left: `${panelBounds.left}px`,
            top: `${panelBounds.top}px`,
            width: `${panelBounds.width}px`,
            height: `${panelBounds.height}px`,
            padding: 0,
            alignItems: 'flex-end',
            justifyContent: 'center'
          } : isDesktop ? {
            // Fallback for desktop when panel bounds not detected
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '1rem'
          } : panelBounds ? {
            // Mobile positioning with panel bounds - slide from panel base
            left: `${panelBounds.left}px`,
            top: `${panelBounds.top}px`,
            width: `${panelBounds.width}px`,
            height: `${panelBounds.height}px`,
            padding: 0,
            alignItems: 'flex-end',
            justifyContent: 'center'
          } : {
            // Mobile positioning fallback - slide from screen bottom
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          })
        }}
      >
        <div
          ref={modalRef}
          className={`overflow-hidden shadow-2xl transition-all duration-500 ease-out ${
            isDesktop && panelBounds
              ? `bg-gray-900 rounded-3xl w-full h-[50vh] ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`
              : isDesktop 
              ? `bg-gray-900 rounded-2xl max-w-md w-full h-[50vh] ${
                  isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`
              : panelBounds
              ? `bg-gray-900 rounded-3xl w-full h-[50vh] ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`
              : `bg-gray-900 w-full h-[60vh] rounded-t-3xl ${
                  isVisible ? 'translate-y-0' : 'translate-y-full'
                }`
          }`}
          style={{
            transition: isDragging ? "none" : "transform 300ms ease-out, opacity 300ms ease-out, scale 300ms ease-out",
          }}
        >
          {/* Drag Handle for mobile - only show on mobile */}
          {!isDesktop && (
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              <div className="w-12 h-1 bg-gray-500 rounded-full"></div>
            </div>
          )}

          {/* Header with Close Button */}
          <div
            className={`flex justify-end p-4 pb-2 ${!isDesktop ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            onTouchStart={!isDesktop ? handleTouchStart : undefined}
            onTouchMove={!isDesktop ? handleTouchMove : undefined}
            onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
            onMouseDown={(e) => {
              // Only enable drag on mobile
              if (!isDesktop) {
                handleMouseDown(e);
              }
            }}
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

          {/* Content */}
          <div className="px-6 pb-6 flex flex-col items-center space-y-6 flex-1 justify-center">
            {/* Status Icon */}
            <div className="flex items-center justify-center min-h-[80px]">
              {isProcessing ? (
                // Three bouncing dots with transition effects
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
                  ></div>
                  <div
                    className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              ) : isFailed ? (
                // Red circle with X for failure with entrance animation
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
                // blue circle with checkmark for success with entrance animation
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
                // Default blue circle with checkmark for other states
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

            {/* Status Text */}
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

            {/* Amount Display - Show for all states in full */}
            <div className="text-center">
              {/* Transaction Description - Show for all states */}
              <p className="text-white text-center text-lg font-medium">
                {`${cryptoAmount.toFixed(1)} ${
                  quote.cryptoType
                } for ${fiatAmount.toFixed(0)} ${quote.fiatType} on ${
                  quote.network.charAt(0).toUpperCase() + quote.network.slice(1)
                }`}
              </p>
            </div>

            {/* Action Button - Only show when completed or failed */}
            {!isProcessing && (
              <div
                className={`w-full transform transition-all duration-500 ${
                  animationPhase === "final"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                <Button
                  onClick={handleDone}
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

export default WithdrawalStatusCard;
