"use client";
import { Input } from "@/app/components/ui/input";
// Use the actual API response type for institutions
interface Institution {
  name: string;
  code: string;
  status: string;
  accountNumberType: string;
  country: string;
  bankId: string;
  id: string;
  seerbitId: string;
  countryAccountNumberType: string;
  createdAt: string;
  updatedAt: string;
  featureFlagEnabled: string[];
  tempDisabledFor: string[];
  channelIds: string[];
  [key: string]: string | string[] | number | boolean;
}
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  VisuallyHidden,
} from "@/app/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { usePreFetchInstitutions } from "@/hooks/useExchangeRate";

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
  const method = buy ? "buy" : "sell";
  const { data: institutions = [], refetch } = usePreFetchInstitutions(
    country,
    method
  );

  // Ensure we refresh when the modal is opened, to pick up backend updates
  useEffect(() => {
    if (open && country) {
      refetch();
    }
  }, [open, country, refetch]);

  if (!open) return null;

  // Filter institutions based on search query
  const filteredInstitutions = (institutions as Institution[])?.filter((institution) =>
    institution.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMpesa = (name: string) => {
    if (name.includes("SAFARICOM")) {
      return "M-PESA";
    }
    return name;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg fixed inset-0 z-40" />
        <DialogPrimitive.Content
          className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 shadow-2xl overflow-hidden
          /* Mobile: bottom sheet behavior */
          bottom-0 left-0 right-0 w-full rounded-t-2xl animate-slide-up-smooth
          /* Desktop: centered modal */
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200 md:transform
          desktop-modal-center"
          style={{
            padding: 0,
            height: "60vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select Institution</DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#232323]">
            <h2 className="text-xl font-medium text-white">
              Select Institution
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="px-6 pb-0">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#232323] border-neutral-600 p-6 rounded-full text-white placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Institutions List */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {institutions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400 text-sm">
                  No institutions available for this country.
                </p>
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400 text-sm">
                  {searchQuery
                    ? "No institutions found matching your search."
                    : "No institutions available for this country."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInstitutions.map((institution) => (
                  <button
                    key={institution.name}
                    onClick={() => onSelect(institution)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#232323] transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-[#232323] rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {renderMpesa(institution.name).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {renderMpesa(institution.name)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
