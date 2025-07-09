"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useKYCStore } from "@/store/kyc-store";
import { KYC_REDIRECT_URL } from "@/constants";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface KYCVerificationModalProps {
  open: boolean;
  onClose: () => void;
  kycLink: string | null;
}

export function KYCVerificationModal({
  open,
  onClose,
  kycLink,
}: KYCVerificationModalProps) {
  const { setIsCheckingKyc, isCheckingKyc, kycData } = useKYCStore();
  const { address } = useWalletGetInfo();
  const [accepted, setAccepted] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (kycData && kycData.kycStatus === "VERIFIED") {
      onClose();
      setIsCheckingKyc(false);
    }
  }, [kycData]);

  if (!open) return null;

  const handleAcceptAndSign = () => {
    setShowQR(true);
    setIsCheckingKyc(true);
  };

  const fullKycUrl = `${kycLink}&metadata={"address":"${address}"}&redirect=${KYC_REDIRECT_URL}`;

  if (showQR) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-[#1c1c1c] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-400 hover:text-white"
          >
            <X size={24} />
          </button>

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
              className="w-full py-6 bg-neutral-800 text-white hover:bg-neutral-700"
              disabled={kycData?.kycStatus === "PENDING"}
              onClick={() => {
                if (kycLink) window.open(fullKycUrl, "_blank");
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
          </div>
          {isCheckingKyc && (
            <div className="w-full flex justify-end p-1">
              <span className="text-neutral-400 text-[10px] text-end">
                Listening...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1c1c1c] rounded-2xl p-6 max-w-md w-full shadow-2xl">
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

          <a
            href="#"
            className="block mt-4 text-sm text-blue-500 hover:text-blue-400"
          >
            Read full KYC Policy
          </a>
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
            className="flex-1 py-6 bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
