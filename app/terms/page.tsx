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
                Welcome to VIFI Holdings ("the Company," "We," "Our"). These Terms of Use 
                ("Terms") govern your access to and use of all products and services offered by 
                VIFI Holdings, including but not limited to Oneramp.io, and any future offerings 
                developed by the Company ("the Services"). When referring to a specific product or 
                service in individual clauses, that product or service will be identified as "the 
                Service" within the context of those clauses. By accessing or using any of these 
                Services, you confirm that you have read, understood, and agree to be bound by these Terms.
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
                <p><strong className="text-white">Company:</strong> Refers to VIFI Holdings, the entity that provides the Services described in these Terms.</p>
                <p><strong className="text-white">Services:</strong> Encompasses all products and services provided by the Company, including but not limited to Oneramp.io, and any future offerings developed by the Company.</p>
                <p><strong className="text-white">Service:</strong> Refers to an individual product or service provided by the Company, as specified in particular clauses of these Terms.</p>
                <p><strong className="text-white">User:</strong> Any individual or entity that accesses or uses the Services provided by the Company.</p>
                <p><strong className="text-white">Third-Party Providers:</strong> Entities or services that are not directly operated by the Company but are involved in the operation of the Services, including those providing technological support, identity verification, and other related functions.</p>
                <p><strong className="text-white">Transaction:</strong> Any action initiated through the Services that involves the transfer or exchange of value, whether in cryptocurrency or other forms.</p>
                <p><strong className="text-white">Provider:</strong> The decentralized system or group of entities involved in the processing, conversion, or transfer of value within the scope of the Services.</p>
                <p><strong className="text-white">Recipient:</strong> The individual or entity designated to receive the outcome of a transaction initiated through the Services.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Introduction</h2>
              <div className="text-gray-300 space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">1.1 Services Overview</h3>
                  <p className="mb-3">
                    VIFI Holdings ("the Company") provides a suite of decentralized financial Services built on blockchain technology. Our primary offering, Oneramp Protocol, is a decentralized network designed to securely and efficiently route payment instructions to liquidity provision nodes. Oneramp Protocol enables various Services to interact with a global decentralized financial infrastructure.
                  </p>
                  <p className="mb-3">
                    One of the Services built on top of Oneramp Protocol is Oneramp.io, an interface that allows senders to create payment intents for Oneramp Protocol. Oneramp.io leverages the underlying Oneramp Protocol for all interactions, ensuring transparency, security, and efficiency.
                  </p>
                  <p>
                    These Terms of Use govern your access to and use of all VIFI Holdings products, including Oneramp Protocol, Oneramp.io, and any future Services developed by VIFI Holdings ("the Services"), except where we expressly state that separate terms (and not these) apply.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">1.2 Legal Entity</h3>
                  <p>
                    VIFI Holdings, which is registered in the Cayman Islands, is the official legal entity accountable for delivering and managing the Services. It is important to note that the Services do not operate as independent legal entities. Instead, they are products developed and provided by the Company, which means all legal responsibilities and obligations related to the Services are held by the Company.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Eligibility</h2>
              <div className="text-gray-300 space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">2.1 User Requirements</h3>
                  <p>To use the Services, you must meet the following criteria:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><strong>Age Requirement:</strong> You must be at least 18 years old, or of legal age in your jurisdiction, to enter into a legally binding agreement.</li>
                    <li><strong>Legal Capacity:</strong> You must have the legal capacity and authority to enter into and be bound by these Terms.</li>
                    <li><strong>Compliance with Laws:</strong> You must comply with all applicable local, national, and international laws, regulations, and guidelines related to the use of the Services.</li>
                    <li><strong>Account Accuracy:</strong> When using the Services, you agree to provide accurate, current, and complete information.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.2 Restrictions for Users of Oneramp.io</h3>
                  <p className="mb-2"><strong>Geographical Restrictions:</strong> Oneramp.io is available in most countries worldwide, with the exception of certain restricted locations:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                    <li><strong>United States:</strong> Oneramp.io is not available to users located in the United States.</li>
                    <li><strong>Countries Flagged for Terrorism Concerns:</strong> Including North Korea, Iran, Syria, Sudan, Afghanistan, Iraq, Libya, Yemen, and others as listed by the U.S. Department of State or OFAC.</li>
                  </ul>
                  
                  <p className="mb-2"><strong>Politically Exposed Persons (PEPs):</strong></p>
                  <p className="ml-4 mb-2">The Company imposes restrictions on transactions involving Politically Exposed Persons, including heads of state, senior politicians, high-ranking military officials, and their immediate family members or close associates.</p>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.3 Disclaimer of Liability</h3>
                  <p>By accessing Oneramp.io, you acknowledge that you are not located in restricted regions and that VIFI Holdings disclaims all responsibility for any consequences arising from unauthorized access from restricted locations.</p>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">2.4 Wallet Connection</h3>
                  <p className="mb-2">To access the Services, you must connect your cryptocurrency wallet. Your wallet serves as your access point to the Services. You are responsible for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Accuracy of wallet information and security credentials</li>
                    <li>Safeguarding private keys and seed phrases</li>
                    <li>Compliance with KYC obligations through third-party providers</li>
                    <li>Ensuring accuracy of recipient information during transactions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Use of the Services</h2>
              <div className="text-gray-300 space-y-2">
                <p>You are permitted to use the Services solely for lawful purposes and in compliance with these Terms. You agree:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Not to use the Services in any manner that would breach applicable laws or regulations</li>
                  <li>Not to engage in fraudulent, unlawful, or harmful activities including money laundering or terrorist financing</li>
                  <li>Not to attempt unauthorized access to any portion of the Services</li>
                  <li>To use the Services ethically and respectfully of others' rights</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Use of Oneramp.io Service</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  <strong>4.1 Transaction Process:</strong> When you initiate a transaction, your digital assets are transferred to a Gateway smart contract and held in escrow until confirmation of receipt from the payment service provider.
                </p>
                <p>
                  <strong>4.2 Transaction Timing:</strong> Transactions are typically completed within 30 seconds, though timing may vary due to network congestion or other external factors.
                </p>
                <p>
                  <strong>4.3 Transaction Limits:</strong> While no specific limits are enforced, successful completion depends on network liquidity availability. Insufficient liquidity will result in prompt refunds.
                </p>
                <p>
                  <strong>4.4 Value Conversion:</strong> Values are determined at the moment of conversion based on current market conditions. The Company is not liable for market fluctuations or perceived disadvantages from rate changes.
                </p>
                <p>
                  <strong>4.5 Costs:</strong> The Service is designed to be free to use, though the Company may collect contributions for operational support. All costs will be clearly disclosed before transaction completion.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Terms for Providers</h2>
              <div className="text-gray-300 space-y-2">
                <p>
                  <strong>5.1-5.3:</strong> Providers must deliver accurate rate information, maintain confidentiality, and comply with applicable laws. They are responsible for addressing transaction issues and cooperating in dispute resolution.
                </p>
                <p>
                  <strong>5.4-5.6:</strong> The Company is not liable for Provider actions. Providers are solely responsible for their service quality. The Company reserves the right to terminate non-compliant Providers.
                </p>
                <p>
                  <strong>5.7-5.8:</strong> Third-party providers handle key aspects of conversion and verification. Users acknowledge risks associated with third-party involvement and agree the Company is not liable for third-party issues. Users must comply with third-party terms and conditions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 text-white">Use of Oneramp Protocol</h2>
              <div className="text-gray-300 space-y-2">
                <p>
                  <strong>6.1-6.3:</strong> Oneramp Protocol operates on a decentralized network with independent entities. The Company does not control transactions once initiated. Users maintain full control of assets and are responsible for wallet security.
                </p>
                <p>
                  <strong>6.4-6.6:</strong> Independent entities operate within legal requirements in their locations. All transactions are irreversible once confirmed. Users must ensure payment detail accuracy. The Protocol is not registered with the SEC as it operates as a decentralized network without handling user funds.
                </p>
              </div>
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
