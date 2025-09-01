"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface OneRampLogoMenuProps {
  children: React.ReactNode; // The logo element
}

export function OneRampLogoMenu({ children }: OneRampLogoMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle clicking outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    {
      label: "Legacy",
      href: "https://pay.oneramp.io",
      description: "Visit our legacy platform",
      external: true
    },
    {
      label: "Terms",
      href: "/terms",
      description: "View our terms of service",
      external: false
    },
    {
      label: "Privacy Policy", 
      href: "/privacy-policy",
      description: "Read our privacy policy",
      external: false
    }
  ];

  return (
    <div 
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Wrapper */}
      <div 
        className={`${isMobile ? 'cursor-pointer' : 'cursor-default'} flex items-center gap-2`}
        onClick={handleToggle}
      >
        {children}
        {/* Arrow Indicator */}
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className="text-gray-400 hover:text-white transition-colors"
          animate={{
            rotate: isOpen ? 90 : 0
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ 
              duration: 0.2, 
              ease: "easeOut" 
            }}
            className={`absolute z-50 mt-2 w-56 bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden ${
              isMobile ? 'left-0' : 'left-0'
            }`}
          >
            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 hover:bg-[#2a2a2a] transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {item.label}
                        {/* External link icon */}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-gray-400 group-hover:text-blue-400 transition-colors"
                        >
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 3h6v6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 14L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </span>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 hover:bg-[#2a2a2a] transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
