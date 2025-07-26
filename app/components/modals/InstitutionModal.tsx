"use client";
import { Input } from "@/components/ui/input";
import { Institution } from "@/types";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAllCountryInstitutions } from "@/hooks/useExchangeRate";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  VisuallyHidden,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface InstitutionModalProps {
  open: boolean;
  onClose: () => void;
  selectedInstitution: Institution | null;
  onSelect: (institution: Institution) => void;
  country: string;
  buy?: boolean;
}

export function InstitutionModal({
  open,
  onClose,
  onSelect,
  country,
  buy,
}: InstitutionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all country institutions using optimized hook
  const {
    data: allInstitutions,
    isLoading: isAllInstitutionsLoading,
    error: allInstitutionsError,
  } = useAllCountryInstitutions(buy ? "buy" : "sell");

  // Fallback: If the country's institutions are not in the pre-fetched data,
  // fetch them individually
  const {
    data: fallbackInstitutions,
    isLoading: isFallbackLoading,
    error: fallbackError,
  } = useQuery({
    queryKey: ["institutions", country, buy ? "buy" : "sell"],
    queryFn: async () => {
      if (!country) return [];
      const { getInstitutions } = await import("@/actions/institutions");
      return await getInstitutions(country, buy ? "buy" : "sell");
    },
    enabled:
      !!country &&
      !allInstitutions?.[country]?.length &&
      !isAllInstitutionsLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current country's institutions from cached data
  const institutions = useMemo(() => {
    if (!country) return [];

    // Use pre-fetched data if available, otherwise use fallback
    return allInstitutions?.[country] || fallbackInstitutions || [];
  }, [country, allInstitutions, fallbackInstitutions]);

  const isLoading = isAllInstitutionsLoading || isFallbackLoading;
  const error = allInstitutionsError || fallbackError;

  if (!open) return null;

  // Filter institutions based on search query
  const filteredInstitutions = institutions?.filter((institution) =>
    institution.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!institutions) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg" />
        <DialogPrimitive.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-none text-white p-0 m-0 w-full max-w-none rounded-t-[2.5rem] shadow-2xl animate-slide-up-smooth overflow-hidden"
          style={{
            padding: 0,
            height: "65vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select Institution</DialogPrimitive.Title>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#232323] rounded-t-[2.5rem]">
            <div className="text-xl font-bold">Select institution</div>
            <button
              className="p-3 hover:bg-[#23232f] rounded-full transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative px-6 py-1 h-14 items-center flex">
            <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="#888"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search institutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-[#23232a] text-white placeholder:text-[#aaa] py-4 pl-12 pr-4 rounded-full border border-[#333] shadow-sm focus:outline-none focus:border-[#bcbcff] focus:ring-2 focus:ring-[#bcbcff]/20 transition-all"
            />
          </div>

          {/* Content */}
          <div
            className="overflow-y-auto px-2 flex-1"
            style={{ height: "calc(50vh - 120px)" }}
          >
            {isLoading && (
              <div className="flex flex-col gap-4 px-4 py-2">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 w-full px-4 py-5"
                  >
                    <Skeleton className="w-11 h-11 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-white text-xs py-8 text-center">
                <p className="text-red-400 mb-2">Failed to load institutions</p>
                <p className="text-gray-400">Please try again later</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-400 hover:text-blue-300 underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="flex flex-col">
              {filteredInstitutions?.map((institution) => (
                <button
                  key={institution.name}
                  className="flex items-center gap-4 w-full px-4 py-5 hover:bg-[#23232f] transition-colors text-left border-b border-[#333] last:border-0 rounded-full"
                  onClick={() => onSelect(institution)}
                  style={{ minHeight: 64 }}
                >
                  {institution.logo ? (
                    <Image
                      src={institution.logo}
                      alt={institution.name}
                      width={44}
                      height={44}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#444] flex items-center justify-center text-white text-lg font-bold">
                      {institution.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-white text-lg font-medium">
                    {institution.name}
                  </span>
                </button>
              ))}

              {filteredInstitutions?.length === 0 && (
                <div className="py-8 text-center text-neutral-400">
                  {searchQuery ? (
                    <p>
                      No institutions found matching &quot;{searchQuery}&quot;
                    </p>
                  ) : (
                    <div>
                      <p className="mb-2">
                        No institutions available for {country}
                      </p>
                      <p className="text-sm">
                        Please try again later or contact support
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
