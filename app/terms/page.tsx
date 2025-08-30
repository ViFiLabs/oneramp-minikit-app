"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
            ← Back to OneRamp
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using OneRamp ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, you should not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              OneRamp is a digital platform that enables users to swap stablecoins for fiat currency 
              through mobile money and bank transfers in Africa. Our service facilitates on-ramp and 
              off-ramp transactions between cryptocurrencies and traditional payment methods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. User Eligibility</h2>
            <div className="text-gray-300 leading-relaxed space-y-3">
              <p>To use OneRamp, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into contracts</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Comply with applicable laws in your jurisdiction</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. KYC and Verification</h2>
            <p className="text-gray-300 leading-relaxed">
              We may require you to complete Know Your Customer (KYC) verification processes to comply 
              with applicable laws and regulations. You agree to provide accurate, current, and complete 
              information during the verification process and to update such information as necessary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Prohibited Activities</h2>
            <div className="text-gray-300 leading-relaxed space-y-3">
              <p>You agree not to use our service for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Money laundering or terrorist financing</li>
                <li>Any illegal activities or violation of applicable laws</li>
                <li>Fraud, deceptive practices, or market manipulation</li>
                <li>Circumventing our security measures or user authentication</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Fees and Payments</h2>
            <p className="text-gray-300 leading-relaxed">
              OneRamp may charge fees for certain transactions. All applicable fees will be clearly 
              displayed before you complete any transaction. You are responsible for any network fees 
              associated with blockchain transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Risk Disclosure</h2>
            <p className="text-gray-300 leading-relaxed">
              Cryptocurrency transactions carry inherent risks including price volatility, regulatory 
              changes, and technical risks. You acknowledge that you understand these risks and agree 
              to bear any losses that may result from using our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              OneRamp shall not be liable for any indirect, incidental, special, or consequential damages 
              arising out of or in connection with your use of the service, even if we have been advised 
              of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes through our platform. Your continued use of the service constitutes acceptance of 
              the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our 
              support channels or visit our website.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="/">Return to OneRamp</Link>
            </Button>
            <Button asChild variant="ghost" className="text-gray-400 hover:text-gray-300">
              <Link href="/privacy-policy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
