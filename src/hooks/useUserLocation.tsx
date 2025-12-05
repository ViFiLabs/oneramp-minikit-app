import { useState, useEffect } from "react";

interface LocationData {
  country: string;
  countryCode: string;
  isLoading: boolean;
  error: string | null;
}

export function useUserLocation() {
  const [locationData, setLocationData] = useState<LocationData>({
    country: "",
    countryCode: "",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setLocationData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Use Cloudflare's trace service (CORS-friendly and reliable)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          "https://www.cloudflare.com/cdn-cgi/trace",
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.text();
          const lines = data.split("\n");
          const locationLine = lines.find((line) => line.startsWith("loc="));

          if (locationLine) {
            const countryCode = locationLine.split("=")[1];

            // Map common country codes to full names
            const countryNames: Record<string, string> = {
              KE: "Kenya",
              UG: "Uganda",
              NG: "Nigeria",
              GH: "Ghana",
              ZM: "Zambia",
              TZ: "Tanzania",
              ZA: "South Africa",
              US: "United States",
              GB: "United Kingdom",
              CA: "Canada",
              // Add more as needed
            };

            setLocationData({
              country: countryNames[countryCode] || countryCode,
              countryCode: countryCode || "",
              isLoading: false,
              error: null,
            });
            return;
          }
        }

        // If Cloudflare fails, try a simple approach
        throw new Error("Geolocation service unavailable");
      } catch (error) {
        console.log(
          "Location detection failed, using default ordering:",
          error
        );
        setLocationData({
          country: "",
          countryCode: "",
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    getUserLocation();
  }, []);

  return locationData;
}
