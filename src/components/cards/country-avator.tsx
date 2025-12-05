import { countries } from "@/data/countries";
import Image from "next/image";
import React from "react";

const CountryAvator = ({
  country,
  iconOnly,
}: {
  country: string;
  iconOnly?: boolean;
}) => {
  // Find country data by country code
  const countryData = countries.find((c) => c.countryCode === country);
  const countryLogo = countryData?.logo;
  const countryName = countryData?.name;

  if (!countryLogo) {
    // Fallback if country not found
    return (
      <div className="size-12 rounded-full bg-gray-600 flex items-center justify-center">
        <span className="text-white text-sm">{country}</span>
      </div>
    );
  }

  if (iconOnly) {
    return (
      <Image
        src={countryLogo}
        alt={countryName || country}
        fill
        className="rounded-full object-contain"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="size-12 rounded-full relative overflow-hidden">
        <Image
          src={countryLogo}
          alt={countryName || country}
          fill
          className="object-cover"
        />
      </div>
      <span className="text-white text-lg font-medium">
        {countryName || country}
      </span>
    </div>
  );
};

export default CountryAvator;
