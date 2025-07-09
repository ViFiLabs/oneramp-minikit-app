"use client";
import { getInstitutions } from "@/actions/institutions";
import { Input } from "@/components/ui/input";
import { Institution } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["institutions", country],
    queryFn: () => getInstitutions(country, buy ? "buy" : "sell"),
  });

  if (!open) return null;

  // Filter institutions based on search query
  const filteredInstitutions = data?.filter((institution) =>
    institution.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#181818] text-white flex flex-col animate-slide-in-top">
      {/* Sticky header with close button and title */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#232323] bg-[#181818] sticky top-0 z-10">
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
      <div className="relative px-6 py-2 bg-[#181818] h-16  items-center flex">
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
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {isLoading && (
          <div className="text-white flex items-center justify-center py-8">
            <Loader className="animate-spin size-6" />
          </div>
        )}

        {error && (
          <div className="text-white text-xs py-8 text-center">
            Error: {error.message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filteredInstitutions?.map((institution) => (
            <button
              key={institution.name}
              className="flex items-center gap-4 w-full px-4 py-5 hover:bg-[#23232f] transition-colors text-left border-b border-[#333] last:border-0 rounded-xl"
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
              No institutions found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
