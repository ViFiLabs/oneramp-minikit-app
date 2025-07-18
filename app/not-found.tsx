"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        {/* 404 Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33M15 9a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* 404 Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white">404</h1>
          <h2 className="text-xl font-semibold text-white">Page Not Found</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. You can go back to the homepage or try searching for what you
            need.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              asChild
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/">Go Home</Link>
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Go Back
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-3">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Swap
              </Link>
              <span className="text-xs text-gray-600">•</span>
              <Link
                href="/"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Pay
              </Link>
              <span className="text-xs text-gray-600">•</span>
              <Link
                href="/"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
