import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";

import EVMProvider from "./providers/EVMProvider";
import { headers } from "next/headers";
import { Toaster } from "@/src/components/ui/sonner";
import { MiniKitContextProvider } from "./providers/minikit-provider";
import { Navbar } from "@/src/components/navigation/navbar";
import { TRPCReactProvider } from "@/src/trpc/client";
import { BACKEND_OUTAGE_MODE } from "@/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title:
      process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ||
      "OneRamp | Spend Your stablecoins in Africa, Anywhere, anytime",
    description:
      "Swap your stablecoins for fiat money using mobile money or bank transfer.",
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
    },
    openGraph: {
      title: "ONERAMP",
      description:
        "Buy, Sell and Spend Your stablecoins in Africa, Anywhere, anytime",
      url: "https://oneramp.io",
      siteName: "ONERAMP",
      images: [
        {
          url: "https://oneramp.io/og-image-oneramp.png",
          width: 1200,
          height: 630,
          alt: "ONERAMP social preview",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@0xOneramp",
      title: "ONERAMP",
      description:
        "Buy, Sell and Spend Your stablecoins in Africa, Anywhere, anytime",
      images: [
        {
          url: "https://oneramp.io/og-image-oneramp.png",
          width: 1200,
          height: 630,
          alt: "ONERAMP social preview",
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // In Next.js 15.x, safely handle cookies without headers()
  // This avoids the headers() Promise issue

  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
        suppressHydrationWarning={true}
      >
        <TRPCReactProvider>
          <MiniKitContextProvider>
            <EVMProvider cookies={cookies}>
              <Navbar />
              {BACKEND_OUTAGE_MODE && (
                <div className="sticky top-0 z-40 border-y border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                  <div className="mx-auto w-full max-w-4xl px-4 py-2 text-center text-xs sm:text-sm text-amber-200">
                    Temporary service disruption: transactions are paused while
                    we stabilize backend connectivity. Please check back shortly.
                  </div>
                </div>
              )}
              <div className="relative">
                {children}
                {BACKEND_OUTAGE_MODE && (
                  <div
                    className="absolute inset-0 z-30 cursor-not-allowed bg-black/25"
                    aria-hidden="true"
                    title="Service is temporarily unavailable"
                  />
                )}
              </div>
            </EVMProvider>
          </MiniKitContextProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
