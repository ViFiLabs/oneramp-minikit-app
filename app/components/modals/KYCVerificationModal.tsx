"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useKYCStore } from "@/store/kyc-store";
import { useKYCStatus } from "@/hooks/useKYCStatus";
// import { KYC_REDIRECT_URL } from "@/constants";
import { X, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface KYCVerificationModalProps {
  open: boolean;
  onClose: () => void;
  kycLink: string | null;
}

export function KYCVerificationModal({
  open,
  onClose,
}: KYCVerificationModalProps) {
  const { setIsCheckingKyc, clearKycData } = useKYCStore();
  const { address } = useWalletGetInfo();
  const { kycData, isPolling, isInDelayedPhase, refetchKYC } = useKYCStatus();
  const [accepted, setAccepted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [fullKycUrl, setFullKycUrl] = useState("");
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { isCheckingKyc } = useKYCStore();

  useEffect(() => {
    if (kycData && kycData.kycStatus === "VERIFIED") {
      onClose();
      setIsCheckingKyc(false);
    }
  }, [kycData, setIsCheckingKyc]);

  // Countdown timer for delayed phase
  useEffect(() => {
    if (isInDelayedPhase && showQR) {
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(30);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isInDelayedPhase, showQR]);

  // Cleanup polling when modal closes
  useEffect(() => {
    if (!open) {
      setIsCheckingKyc(false);
      // Cleanup countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(30);
    }
  }, [open, setIsCheckingKyc]);

  useEffect(() => {
    if (address) {
      (async () => {
        try {
          const inMini = await sdk.isInMiniApp();
          const context = await sdk.context;
          const platform = context.client.platformType;

          const destination =
            inMini && platform === "mobile"
              ? "https://mini.oneramp.io"
              : "https://farcaster.xyz/miniapps/IFyB1NW3qMPb/oneramp";

          // Construct URL without double-encoding
          const metadata = JSON.stringify({ address });
          const baseUrl = "https://signup.metamap.com/";
          const params = new URLSearchParams({
            clientId: "671a3cf5673134001da20657",
            flowId: "671a3cf5673134001da20656",
            metadata: metadata,
            redirect: destination,
          });

          setFullKycUrl(`${baseUrl}?${params.toString()}`);
        } catch (error) {
          console.error("Error determining redirect URL:", error);
          // Fallback to web app URL if detection fails
          const metadata = JSON.stringify({ address });
          const baseUrl = "https://signup.metamap.com/";
          const params = new URLSearchParams({
            clientId: "671a3cf5673134001da20657",
            flowId: "671a3cf5673134001da20656",
            metadata: metadata,
            redirect: "https://farcaster.xyz/miniapps/IFyB1NW3qMPb/oneramp",
          });

          setFullKycUrl(`${baseUrl}?${params.toString()}`);
        }
      })();
    }
  }, [address]);

  if (!open) return null;

  const handleAcceptAndSign = () => {
    setShowQR(true);
    setIsCheckingKyc(true);
    // The useKYCStatus hook will automatically start polling when isCheckingKyc becomes true
  };

  // Handle KYC rejection
  const handleKYCRejection = () => {
    // Reset KYC state and close modal
    setIsCheckingKyc(false);
    clearKycData(); // Clear rejected KYC data
    onClose();
  };

  // Show initial acceptance screen for new users or when KYC hasn't been started
  // Only show status screens if user has explicitly started KYC process
  if (!isCheckingKyc) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c]   md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c]  md:rounded-2xl p-6 max-w-md w-full shadow-2xl
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#232323] rounded-xl">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M4 4v16a2 2 0 002 2h12a2 2 0 002-2V8.342a2 2 0 00-.602-1.43l-4.44-4.342A2 2 0 0013.56 2H6a2 2 0 00-2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl text-white font-semibold mb-1">
                Verify your identity in just{" "}
                <span className="text-orange-500">2 minutes</span>
              </h2>
            </div>
          </div>

          <div className="mt-6 bg-[#232323] rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">
              Accept terms to get started
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-neutral-400 text-sm">
                  We do not store any personal information. All personal data is
                  handled exclusively by our third-party KYC provider.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-neutral-400 text-sm">
                  We only store the KYC reference code and signing wallet
                  address for verification and audit purposes.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-neutral-400 text-sm">
                  We rely on the third-party provider&apos;s rigorous data
                  protection measures to ensure that your personal information
                  is secure.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
              className="mt-1 !text-white"
            />
            <label htmlFor="terms" className="text-neutral-400 text-sm">
              By clicking &quot;Accept&quot; below, you are agreeing to the KYC
              Policy and hereby request an identity verification check for your
              wallet address.
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 py-6 !text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              No, thanks
            </Button>
            <Button
              disabled={!accepted}
              onClick={handleAcceptAndSign}
              className="flex-1 py-6 !bg-neutral-700 !text-white hover:!bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prevent new KYC submission if user has REJECTED or IN_REVIEW status
  if (kycData?.kycStatus === "REJECTED" || kycData?.kycStatus === "IN_REVIEW") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-900/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <h2 className="text-xl text-white font-semibold mb-2">
              KYC Already in Progress
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              {kycData?.kycStatus === "REJECTED"
                ? "Your previous KYC verification was rejected. Please wait for the review process to complete before submitting a new verification."
                : "Your KYC verification is currently under review. Please wait for the review process to complete before submitting a new verification."}
            </p>

            <div className="bg-[#232323] rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    {kycData?.kycStatus === "REJECTED"
                      ? "Your verification was not approved and is being reviewed"
                      : "Your verification is being reviewed by our team"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  window.open("https://t.me/+Hnr5eySeSoMyOTM0", "_blank");
                }}
                className="w-full py-4 !bg-blue-600 text-white hover:!bg-blue-700"
              >
                Contact Support
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-neutral-500 text-xs">
                Need help? Contact our support team for assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show KYC status based on current status
  if (kycData?.kycStatus === "REJECTED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={handleKYCRejection}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-900/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h2 className="text-xl text-white font-semibold mb-2">
              KYC Verification Rejected
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your identity verification was not approved. This could be due to:
            </p>

            <div className="bg-[#232323] rounded-xl p-4 mb-6 text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Document quality issues (blurry, incomplete, or expired)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Information mismatch between documents
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Unsupported document type for your region
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-700">
                <p className="text-red-400 text-xs">
                  ⚠️ Real-time verification detected rejection
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  window.open("https://t.me/+Hnr5eySeSoMyOTM0", "_blank");
                }}
                className="w-full py-4 !bg-blue-600 text-white hover:!bg-blue-700"
              >
                Contact Support
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-neutral-500 text-xs">
                Need help? Contact our support team for assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show IN_REVIEW KYC status
  if (kycData?.kycStatus === "IN_REVIEW") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-900/20 rounded-full">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <h2 className="text-xl text-white font-semibold mb-2">
              Verification Under Review
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your identity verification is currently being reviewed by our
              team. This process typically takes a few minutes.
            </p>

            <div className="bg-[#232323] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center mb-4"></div>
              {isPolling && (
                <p className="text-blue-400 text-xs animate-pulse">
                  Monitoring....
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  window.open("https://t.me/+Hnr5eySeSoMyOTM0", "_blank");
                }}
                className="w-full py-4 !bg-blue-600 text-white hover:!bg-blue-700"
              >
                Contact Support
              </Button>
              <Button
                onClick={() => {
                  refetchKYC();
                }}
                className="w-full py-4 !bg-green-600 !text-white hover:!bg-green-700"
              >
                <p className="text-white">Finished KYC</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="ml-2"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-neutral-500 text-xs">
                Need help? Contact our support team for assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show pending KYC status
  if (kycData?.kycStatus === "PENDING") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-900/20 rounded-full">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <h2 className="text-xl text-white font-semibold mb-2">
              Verification in Progress
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your identity verification is being reviewed. This usually takes
              2-5 minutes.
            </p>

            <div className="bg-[#232323] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
              <p className="text-neutral-400 text-sm mb-2">
                Please wait while we verify your documents...
              </p>
              {isPolling && (
                <p className="text-blue-400 text-xs">
                  ✓ Actively checking for updates...
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  window.open(fullKycUrl, "_blank");
                }}
                variant="ghost"
                className="w-full py-4 !text-blue-600 hover:!text-white hover:!bg-transparent"
              >
                <p className="text-blue-600">Open KYC Link</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="ml-2"
                >
                  <path
                    d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 3h6v6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 14L21 3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              <Button
                onClick={() => {
                  refetchKYC();
                }}
                className="w-full py-4 !bg-green-600 !text-white hover:!bg-green-700"
              >
                <p className="text-white">Finished KYC</p>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="ml-2"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full py-4 !text-neutral-400 hover:!text-white hover:!bg-neutral-800"
              >
                <p className="text-neutral-400">Close</p>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show successful KYC status
  if (kycData?.kycStatus === "VERIFIED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-900/20 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <h2 className="text-xl text-white font-semibold mb-2">
              Verification Successful!
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your identity has been verified successfully. You can now proceed
              with your transaction.
            </p>

            <div className="bg-[#232323] rounded-xl p-4 mb-6">
              <p className="text-green-400 text-sm">
                ✓ Real-time verification completed
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full py-4 bg-green-600 text-white hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showQR) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c] md:bg-black/60 md:backdrop-blur-lg">
        <div
          className="bg-[#1c1c1c] md:rounded-2xl p-6 max-w-md w-full shadow-2xl relative
        /* Mobile: full screen */
        /* Desktop: centered modal */
        md:max-w-lg md:mx-4"
        >
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-4 top-4 !text-white hover:!text-white"
          >
            <X size={24} />
          </Button>

          <div className="text-center">
            <h2 className="text-xl text-white font-semibold mb-2">
              Verify with your phone or URL
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Scan with your phone to have the best verification experience. You
              can also open the URL below
            </p>

            <div className="bg-white p-4 rounded-xl mb-4 mx-auto max-w-[280px]">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
                  fullKycUrl
                )}`}
                alt="KYC verification QR code"
                width={256}
                height={256}
                className="w-full h-full"
                unoptimized
              />
            </div>

            <div className="text-center text-neutral-400 text-sm mb-4">or</div>

            <Button
              className="w-full py-6 bg-neutral-800 text-white hover:bg-neutral-700 cursor-pointer"
              onClick={() => {
                window.open(fullKycUrl, "_blank");
              }}
            >
              Open URL
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="ml-2"
              >
                <path
                  d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3h6v6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14L21 3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            <Button
              onClick={() => {
                refetchKYC();
              }}
              className="w-full py-4 !bg-green-600 !text-white hover:!bg-green-700"
            >
              <p className="text-white">Finished KYC</p>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="ml-2"
              >
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            {isInDelayedPhase && (
              <div className="mt-4 p-3 bg-yellow-900/20 rounded-xl">
                <p className="text-yellow-400 text-xs">
                  ⏳ Please complete your verification. We&apos;ll start
                  monitoring in {countdown} seconds...
                </p>
              </div>
            )}
            {isPolling && !isInDelayedPhase && (
              <div className="mt-4 p-3 bg-blue-900/20 rounded-xl">
                <p className="text-blue-400 text-xs">
                  🔄 Monitoring verification status in real-time...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c]   md:bg-black/60 md:backdrop-blur-lg">
      <div
        className="bg-[#1c1c1c]  md:rounded-2xl p-6 max-w-md w-full shadow-2xl
      /* Mobile: full screen */
      /* Desktop: centered modal */
      md:max-w-lg md:mx-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-[#232323] rounded-xl">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M4 4v16a2 2 0 002 2h12a2 2 0 002-2V8.342a2 2 0 00-.602-1.43l-4.44-4.342A2 2 0 0013.56 2H6a2 2 0 00-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl text-white font-semibold mb-1">
              Verify your identity in just{" "}
              <span className="text-orange-500">2 minutes</span>
            </h2>
          </div>
        </div>

        <div className="mt-6 bg-[#232323] rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">
            Accept terms to get started
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">
                We do not store any personal information. All personal data is
                handled exclusively by our third-party KYC provider.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">
                We only store the KYC reference code and signing wallet address
                for verification and audit purposes.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">
                We rely on the third-party provider&apos;s rigorous data
                protection measures to ensure that your personal information is
                secure.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
            className="mt-1 !text-white"
          />
          <label htmlFor="terms" className="text-neutral-400 text-sm">
            By clicking &quot;Accept&quot; below, you are agreeing to the KYC
            Policy and hereby request an identity verification check for your
            wallet address.
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 py-6 !text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            No, thanks
          </Button>
          <Button
            disabled={!accepted}
            onClick={handleAcceptAndSign}
            className="flex-1 py-6 !bg-neutral-700 !text-white hover:!bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
