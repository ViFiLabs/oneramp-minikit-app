import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";

import EVMProvider from "./providers/EVMProvider";
import StarknetProvider from "./providers/StarknetProvider";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { MiniKitContextProvider } from "./context/minikit-provider";

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
      "OneRamp | Swap your stablecoins for fiat money",
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
      >
        <MiniKitContextProvider>
          <EVMProvider cookies={cookies}>
            <StarknetProvider>{children}</StarknetProvider>
          </EVMProvider>
        </MiniKitContextProvider>
        <Toaster />
      </body>
    </html>
  );
}
