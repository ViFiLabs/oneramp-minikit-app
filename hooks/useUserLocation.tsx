import { useState, useEffect } from 'react';

interface LocationData {
  country: string;
  countryCode: string;
  isLoading: boolean;
  error: string | null;
}

export function useUserLocation() {
  const [locationData, setLocationData] = useState<LocationData>({
    country: '',
    countryCode: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setLocationData(prev => ({ ...prev, isLoading: true, error: null }));

        // Try primary service: ipapi.co
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch('https://ipapi.co/json/', {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.country_code) {
              setLocationData({
                country: data.country_name || '',
                countryCode: data.country_code || '',
                isLoading: false,
                error: null,
              });
              return;
            }
          }
        } catch (primaryError) {
          console.log('Primary geolocation service failed, trying fallback...');
        }

        // Fallback service: ipinfo.io (free tier)
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 5000);

        const fallbackResponse = await fetch('https://ipinfo.io/json', {
          signal: fallbackController.signal,
        });

        clearTimeout(fallbackTimeoutId);

        if (!fallbackResponse.ok) {
          throw new Error('Both geolocation services failed');
        }

        const fallbackData = await fallbackResponse.json();

        setLocationData({
          country: fallbackData.country || '',
          countryCode: fallbackData.country || '', // ipinfo.io uses 2-letter country code
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.log('All location detection failed:', error);
        setLocationData({
          country: '',
          countryCode: '',
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    getUserLocation();
  }, []);

  return locationData;
} 