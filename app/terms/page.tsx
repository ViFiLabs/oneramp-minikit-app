"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="p-6 pb-4 border-b border-[#333]">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
            Go back
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Terms of Use</h1>
          <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Scrollable Content */}
        <div className="h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <p className="text-gray-300 mb-4">
                Welcome to OneRamp, Inc. ("the Company," "We," "Our"). These Terms of Use 
                ("Terms") govern your access to and use of all products and services offered by 
                OneRamp, Inc., including but not limited to OneRamp Protocol, noblocks.xyz, and any 
                future offerings developed by the Company ("the Services"). When referring to a 
                specific product or service in individual clauses, that product or service will be 
                identified as "the Service" within the context of those clauses. By accessing or using 
                any of these Services, you confirm that you have read, understood, and agree to be 
                bound by these Terms.
              </p>
              <p className="text-gray-300 mb-4">
                If you do not agree to these Terms, or if you are located in a region where access to a 
                specific Service is restricted, please discontinue your use of that Service immediately. 
                Continued access or use of the Services signifies your acceptance of these Terms and 
                any updates or modifications.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Definitions</h2>
              <p className="text-gray-300 mb-4">
                For the purposes of these Terms of Service, the following definitions apply:
              </p>
              <div className="space-y-3 text-gray-300">
                <p><strong className="text-white">Company:</strong> Refers to OneRamp, Inc., the entity that provides the Services described in these Terms.</p>
                <p><strong className="text-white">Services:</strong> Encompasses all products and services provided by the Company, including but not limited to OneRamp Protocol, noblocks.xyz, and any future offerings developed by the Company.</p>
                <p><strong className="text-white">Service:</strong> Refers to an individual product or service provided by the Company, as specified in particular clauses of these Terms.</p>
                <p><strong className="text-white">User:</strong> Any individual or entity that accesses or uses the Services provided by the Company.</p>
                <p><strong className="text-white">Third-Party Providers:</strong> Entities or services that are not directly operated by the Company but are involved in the operation of the Services, including those providing technological support, identity verification, and other related functions.</p>
                <p><strong className="text-white">Transaction:</strong> Any action initiated through the Services that involves the transfer or exchange of digital assets, fiat currency, or other value.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
              <p className="text-gray-300">
                By accessing and using OneRamp ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to these terms, you should not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">2. Description of Service</h2>
              <p className="text-gray-300">
                OneRamp is a digital platform that enables users to swap stablecoins for fiat currency 
                through mobile money and bank transfers in Africa. Our service facilitates on-ramp and 
                off-ramp transactions between cryptocurrencies and traditional payment methods.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">3. User Eligibility</h2>
              <div className="text-gray-300 space-y-2">
                <p>To use OneRamp, you must:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Have the legal capacity to enter into contracts</li>
                  <li>Provide accurate and complete information during registration</li>
                  <li>Comply with applicable laws in your jurisdiction</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">4. KYC and Verification</h2>
              <p className="text-gray-300">
                We may require you to complete Know Your Customer (KYC) verification processes to comply 
                with applicable laws and regulations. You agree to provide accurate, current, and complete 
                information during the verification process and to update such information as necessary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">5. Prohibited Activities</h2>
              <div className="text-gray-300 space-y-2">
                <p>You agree not to use our service for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Money laundering or terrorist financing</li>
                  <li>Any illegal activities or violation of applicable laws</li>
                  <li>Fraud, deceptive practices, or market manipulation</li>
                  <li>Circumventing our security measures or user authentication</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">6. Fees and Payments</h2>
              <p className="text-gray-300">
                OneRamp may charge fees for certain transactions. All applicable fees will be clearly 
                displayed before you complete any transaction. You are responsible for any network fees 
                associated with blockchain transactions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">7. Risk Disclosure</h2>
              <p className="text-gray-300">
                Cryptocurrency transactions carry inherent risks including price volatility, regulatory 
                changes, and technical risks. You acknowledge that you understand these risks and agree 
                to bear any losses that may result from using our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">8. Limitation of Liability</h2>
              <p className="text-gray-300">
                OneRamp shall not be liable for any indirect, incidental, special, or consequential damages 
                arising out of or in connection with your use of the service, even if we have been advised 
                of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">9. Modifications to Terms</h2>
              <p className="text-gray-300">
                We reserve the right to modify these terms at any time. We will notify users of significant 
                changes through our platform. Your continued use of the service constitutes acceptance of 
                the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">10. Contact Information</h2>
              <p className="text-gray-300 mb-6">
                If you have any questions about these Terms of Service, please contact us through our 
                support channels or visit our website.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
