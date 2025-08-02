import { useEffect, useRef } from "react";
import { useKYCStore } from "@/store/kyc-store";
import { getKYC } from "@/actions/kyc";
import useWalletGetInfo from "./useWalletGetInfo";

export const useKYCStatus = () => {
  const { address } = useWalletGetInfo();
  const {
    kycData,
    setKycData,
    isPolling,
    setIsPolling,
    isCheckingKyc,
    isInDelayedPhase,
    setIsInDelayedPhase,
  } = useKYCStore();

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const delayedPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Cleanup function
  const cleanupPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (delayedPollingRef.current) {
      clearTimeout(delayedPollingRef.current);
      delayedPollingRef.current = null;
    }
    isPollingRef.current = false;
    setIsPolling(false);
    setIsInDelayedPhase(false);
  };

  // Start polling when KYC verification begins
  useEffect(() => {
    if (isCheckingKyc && address && !isPollingRef.current) {
      console.log("KYC verification started for address:", address);

      // Set delayed phase immediately when KYC starts
      setIsInDelayedPhase(true);

      // Delay polling start to allow user time to complete KYC process
      // Wait 30 seconds before starting serious polling (estimate for KYC completion)
      delayedPollingRef.current = setTimeout(() => {
        console.log("Starting KYC polling after delay for address:", address);
        isPollingRef.current = true;
        setIsPolling(true);
        setIsInDelayedPhase(false); // Exit delayed phase when polling starts

        // Initial check
        const checkKYCStatus = async () => {
          try {
            const response = await getKYC(address);
            if (response) {
              console.log("KYC status update:", response.kycStatus);
              setKycData(response);

              // Stop polling if verification is complete (VERIFIED, REJECTED, or IN_REVIEW)
              if (
                response.kycStatus === "VERIFIED" ||
                response.kycStatus === "REJECTED" ||
                response.kycStatus === "IN_REVIEW"
              ) {
                console.log("KYC verification complete, stopping polling");
                cleanupPolling();
              }
            }
          } catch (error) {
            console.error("Error checking KYC status:", error);
          }
        };

        // Initial check
        checkKYCStatus();

        // Set up polling interval (check every 3 seconds for faster updates)
        pollingIntervalRef.current = setInterval(checkKYCStatus, 3000);
      }, 30000); // 30 second delay

      return cleanupPolling;
    }
  }, [isCheckingKyc, address, setKycData, setIsPolling, setIsInDelayedPhase]);

  // Stop polling when component unmounts
  useEffect(() => {
    return cleanupPolling;
  }, []);

  return {
    kycData,
    isPolling,
    isCheckingKyc,
    isInDelayedPhase,
  };
};
