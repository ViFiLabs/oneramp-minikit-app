"use client";

import NextImage from "next/image";
import Link from "next/link";
import { ModalConnectButton } from "@/app/components/wallet/modal-connect-button";
import { Suspense } from "react";
import { Badge } from "@/app/components/ui/badge";
import { OneRampLogoMenu } from "@/app/components/OneRampLogoMenu";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`w-full h-14 border-b bg-black/80 backdrop-blur-sm sticky top-0 z-50 transition-all duration-200 ${
        scrolled 
          ? "border-gray-800/80 shadow-lg shadow-black/20" 
          : "border-gray-800/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <OneRampLogoMenu>
              <div className="relative flex items-center gap-2">
                <NextImage
                  src="/large.png"
                  alt="OneRamp"
                  width={80}
                  height={32}
                  priority
                  className="rounded-full"
                />
                <Badge
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0 bg-blue-500 text-white border-0"
                >
                  BETA
                </Badge>
              </div>
            </OneRampLogoMenu>
          </div>

          {/* Right side - Connect Button */}
          <div className="flex items-center">
            <ModalConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
