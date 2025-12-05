import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

// Metadata for SEO optimization
export const metadata: Metadata = {
  title: "Privacy Policy | VIFI Holdings - Oneramp.io",
  description: "Read VIFI Holdings privacy policy. Learn how we protect your data when using Oneramp.io and our decentralized financial services. Your privacy is our priority.",
  keywords: ["privacy policy", "VIFI Holdings", "Oneramp.io", "data protection", "cryptocurrency privacy", "DeFi privacy"],
  robots: "index, follow",
  openGraph: {
    title: "Privacy Policy | VIFI Holdings",
    description: "Privacy policy for VIFI Holdings services including Oneramp.io and data protection practices",
    type: "website"
  }
};

// Pre-calculate the date at build time
const LAST_UPDATED = new Date().toLocaleDateString();

// Loading component for better UX
function PrivacyLoading() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden">
        <div className="p-6 pb-4 border-b border-[#333]">
          <div className="h-4 bg-gray-700 rounded w-20 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-700 rounded w-40 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Scrollable Content */}
        <div className="h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">1. Introduction</h2>
              <p className="text-gray-300">
                Welcome to VIFI Holdings ("The Company," "we," "our," or "us"), a Cayman Islands company and the entity behind Oneramp.io ("the Services"). We are committed to protecting the privacy and personal information of our users ("you," "your," or "user"). This Privacy Policy outlines how we collect, use, share, and protect your personal data when you use our Service, which allows for cryptocurrency on-ramps and off-ramps, including conversions between cryptocurrency and local currency. By using our Service, you agree to the practices described in this Privacy Policy. If you do not agree to any of our practices in this Privacy Policy, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">2. Information We Collect</h2>
              <div className="text-gray-300 space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">2.1. Information We Do Not Collect Directly</h3>
                  <p>We do not directly collect or store personal information from our users. Our service allows you to connect your cryptocurrency wallet to our app without the need for you to provide personal details to us.</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">2.2. Information Collected During Wallet Connection</h3>
                  <p>When you connect your crypto wallet to our app, the following information may be automatically shared with us:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Public Wallet Address: We receive your public wallet address, which is necessary for facilitating transactions and interactions within the app.</li>
                    <li>Transaction Data: Information related to transactions made through the app, such as transaction amounts, recipient addresses, and associated metadata, may be captured.</li>
                    <li>Device and Usage Information: We may collect non-personal data such as IP addresses, device type, browser version, and interaction logs to enhance the security and performance of our service.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.3. Information Collected Through KYC Verification</h3>
                  <p>To comply with regulatory requirements, users are required to complete Know Your Customer (KYC) verification through our third-party provider. We do not collect or store personal information submitted during the KYC process. However, after verification, we retain the following:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>KYC Reference Code: A unique reference code provided by our third-party provider, which confirms that KYC has been successfully completed.</li>
                    <li>Wallet Address: The public wallet address associated with the private key that signed the KYC verification.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.4 Non-Personal Information</h3>
                  <p>We may also collect non-personal information, which includes aggregated or anonymized data that does not directly identify you. This data may encompass general usage patterns, trends, and statistical insights into how our service is utilized. We use this information to analyze performance, enhance the functionality of our service, and develop new features, ensuring a better user experience for all.</p>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.5 Transaction Information</h3>
                  <p>In the course of providing our Services, the Company retains certain information related to the recipient of a transaction. Specifically, we store the recipient's account details (e.g., bank account or other relevant payment information) and a receipt of the transaction. This information is retained to ensure compliance with legal and regulatory obligations, facilitate transaction tracking, and maintain service transparency.</p>
                  <p className="mt-2">Please note that the retention of these details is limited to what is necessary for the functioning of our Services and adherence to applicable laws. The Company does not use or share this information for any other purpose without the user's explicit consent, except where required by law.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">3. How We Use Your Information</h2>
              <div className="text-gray-300 space-y-2">
                <p>We utilize the information we collect for a variety of essential purposes, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Service Delivery: We use the information we collect to manage and coordinate transactions between you and the recipient. This involves receiving your submitted transaction, working with our third-party providers to ensure that the transfer is handled properly, and confirming that the recipient receives the intended value in their preferred form.</li>
                  <li>Legal Compliance: To fulfill our legal and regulatory obligations, including adhering to Know Your Customer (KYC) and Anti-Money Laundering (AML) laws, ensuring that our operations remain lawful and transparent.</li>
                  <li>Service Enhancement: To analyze usage patterns and user interactions, allowing us to continuously improve our service, optimize performance, and introduce new features that meet your evolving needs.</li>
                  <li>Security and Protection: To safeguard our users and our company by detecting, investigating, and preventing fraud, unauthorized activities, and other potential security threats, maintaining the integrity and security of our platform.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">4. How We Share Your Information</h2>
              <div className="text-gray-300 space-y-2">
                <p>We may share your information in the following circumstances to ensure the smooth operation of our service and to comply with legal and regulatory requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>With Third-Party Service Providers: We partner with trusted third-party service providers to perform essential functions on our behalf. These functions include processing payments, exchanging digital assets into the recipient's preferred form of value, conducting Know Your Customer (KYC) checks, and providing other services required to operate our platform.</li>
                  <li>For Legal and Compliance Reasons: We may disclose your information when required to comply with applicable laws, regulations, or legal processes. This includes responding to subpoenas, court orders, or government requests.</li>
                  <li>With Your Consent: In situations where your explicit consent is required, we will ask for your permission before sharing your information with third parties for purposes not covered by this Privacy Policy.</li>
                  <li>In Business Transfers: If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">5. Security of Your Information</h2>
              <div className="text-gray-300 space-y-2">
                <p>We are committed to ensuring the security of your interactions with our Service. While we employ industry-standard encryption and secure servers to safeguard any information processed through our Service, no system can guarantee absolute security.</p>
                <p className="font-medium text-white mt-3 mb-2">Your Responsibilities:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Wallet Security: You are responsible for securing your cryptocurrency wallet and any associated credentials. Ensure that your wallet information is kept confidential and use strong security practices to protect it.</li>
                  <li>Device Security: Protect your personal devices and any access points to your cryptocurrency wallet from unauthorized use. This includes keeping your software and systems up-to-date and using secure, unique passwords.</li>
                </ul>
                <p className="mt-2">By using our Service, you acknowledge that while we strive to implement robust security measures, you are ultimately responsible for your wallet's security and for any transactions made through it.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">6. Your Rights</h2>
              <div className="text-gray-300 space-y-2">
                <p>Although we do not collect or retain personal data directly, you have the following rights concerning any information processed through our Service:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access: You may request information about any personal data collected or processed by our third-party providers in relation to your use of the Service.</li>
                  <li>Correction: If you believe that any personal information held by our third-party providers is inaccurate or incomplete, you can request that it be corrected or updated.</li>
                  <li>Deletion: You have the right to request the deletion of your personal information. Since we do not store personal data directly, any request for deletion will be directed to the relevant third-party service managing your data.</li>
                  <li>Restriction: You may request that the processing of your personal data be restricted under certain conditions.</li>
                  <li>Data Portability: If applicable, you have the right to obtain a copy of your personal data in a structured, commonly used, and machine-readable format.</li>
                </ul>
                <p className="mt-2">To exercise any of these rights or for any questions related to your personal information, please contact us at legal@oneramp.io.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">7. International Data Transfers</h2>
              <p className="text-gray-300">
                As a global service, we may facilitate transactions and processes involving data that could be transferred to countries outside of your jurisdiction, including the Cayman Islands, where our company is based. However, as we do not collect or directly manage personal data, any data transfers are handled by our third-party providers. When your data is transferred internationally by these third-party providers, they are required to implement appropriate measures to ensure that your information is protected in accordance with applicable data protection laws and in alignment with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">8. Retention of Your Information</h2>
              <p className="text-gray-300">
                Since we do not directly collect personal information from our users, the data we retain is limited to the reference codes, wallet addresses associated with transactions and KYC verification, recipient bank details and proof of transaction. This information is kept only for as long as necessary to fulfill the operational purposes outlined in this Privacy Policy, including compliance with legal obligations and the resolution of disputes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">9. Third-Party Applications and Services</h2>
              <div className="text-gray-300 space-y-2">
                <p>Our service may involve the use of third-party applications or services that may request personal information from you and use cookies or similar technologies. While these third-party providers are independent entities with their own privacy practices, we partner only with entities that comply with relevant data protection laws.</p>
                <p>When you interact with third-party applications through our service, they may request personal information such as your name, email address, or payment details. This information is collected and processed by the third party, not by us. We recommend reviewing the privacy policies of any third-party services you use to understand how your information will be handled.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">10. Children's Privacy</h2>
              <div className="text-gray-300 space-y-2">
                <p>Our services are not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you are under 18, please do not use our services or submit any personal information through our platform.</p>
                <p>If we become aware that we have inadvertently received personal information from a child without parental consent, we will take steps to delete such information from our records. If you believe that a child under 18 has provided us with personal information, please contact us at legal@oneramp.io.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">11. Automated Decision-Making and Profiling</h2>
              <p className="text-gray-300">
                We do not engage in automated decision-making processes or profiling that produce legal effects or significantly affect you as an individual. Our service is designed to facilitate cryptocurrency transactions with human oversight, ensuring that while automation aids in processing, key decisions and any complex issues are reviewed and monitored by our team to provide a fair and secure experience.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any significant changes by posting the updated policy on our website and indicating the effective date. Please review this Privacy Notice regularly to ensure that you are aware of its terms. Your continued use of our service after the effective date constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">13. Contact Us</h2>
              <p className="text-gray-300 mb-6">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at legal@oneramp.io.
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
