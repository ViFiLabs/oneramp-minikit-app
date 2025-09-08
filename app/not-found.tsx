'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function NotFound() {
  // Set document title and meta tags for client component
  useEffect(() => {
    document.title = "Page Not Found | Oneramp.io";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "The page you're looking for doesn't exist. Return to Oneramp.io to continue using our decentralized financial services.");
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = "The page you're looking for doesn't exist. Return to Oneramp.io to continue using our decentralized financial services.";
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    
    // Set robots meta
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Cartoon Eyes */}
        <div className="mb-12 flex justify-center gap-8">
          {/* Left Eye */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-2xl border-4 border-gray-200 flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Right Eye */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-2xl border-4 border-gray-200 flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 404 Message */}
        <div className="space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
            404, Page Not Found.
          </h1>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white hover:bg-gray-200 text-black font-medium px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white"
          >
            <Link href="/">Please Take Me Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
