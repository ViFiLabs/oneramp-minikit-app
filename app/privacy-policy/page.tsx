"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPolicy() {
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Scrollable Content */}
        <div className="h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">1. Information We Collect</h2>
              <div className="text-gray-300 space-y-2">
                <p>We collect information you provide directly to us, such as:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Personal identification information (name, email, phone number)</li>
                  <li>Wallet addresses and transaction data</li>
                  <li>KYC verification documents and information</li>
                  <li>Device information and usage data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">2. How We Use Your Information</h2>
              <div className="text-gray-300 space-y-2">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and verify user identity</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Communicate with you about our services</li>
                  <li>Prevent fraud and enhance security</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">3. Information Sharing and Disclosure</h2>
              <div className="text-gray-300 space-y-2">
                <p>We may share your information in the following situations:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>With third-party service providers who assist in our operations</li>
                  <li>To comply with legal obligations or law enforcement requests</li>
                  <li>To protect our rights, privacy, safety, or property</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">4. KYC and Third-Party Verification</h2>
              <p className="text-gray-300">
                We use third-party KYC providers to verify user identity. Your personal information 
                may be shared with these providers solely for verification purposes. We do not store 
                sensitive personal documents on our servers - they are handled exclusively by our 
                third-party KYC provider in accordance with their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">5. Data Security</h2>
              <p className="text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the internet is 100% secure, and we cannot guarantee 
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">6. Data Retention</h2>
              <p className="text-gray-300">
                We retain your personal information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements. Transaction 
                data may be retained for longer periods as required by applicable regulations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">7. International Data Transfers</h2>
              <p className="text-gray-300">
                Your information may be transferred to and processed in countries other than your country 
                of residence. We ensure that such transfers comply with applicable data protection laws 
                and provide appropriate safeguards for your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">8. Your Rights</h2>
              <div className="text-gray-300 space-y-2">
                <p>Depending on your location, you may have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access, update, or delete your personal information</li>
                  <li>Object to or restrict the processing of your information</li>
                  <li>Data portability</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">9. Cookies and Tracking</h2>
              <p className="text-gray-300">
                We use cookies and similar tracking technologies to enhance your experience on our platform. 
                You can control cookie settings through your browser preferences, though this may affect 
                the functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">11. Contact Us</h2>
              <p className="text-gray-300 mb-6">
                If you have any questions about this Privacy Policy or our privacy practices, please 
                contact us through our support channels or visit our website for more information.
              </p>
            </section>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 pt-4 border-t border-[#333]">
        </div>
      </div>
    </div>
  );
}
