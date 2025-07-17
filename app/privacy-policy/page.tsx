import React from 'react';
import AppHeader from '@/components/layout/AppHeader';

const PrivacyPolicy = () => (
  <>
    <AppHeader />
    <main className="max-w-3xl mx-auto px-4 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-400 mb-2">Last Updated: July 10, 2025</p>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Introduction</h2>
        <p>Welcome to Rampz ("we," "us," or "our"). We are committed to protecting your privacy and providing a secure, decentralized platform for peer-to-peer (P2P) crypto-to-fiat and fiat-to-crypto transactions.</p>
        <p className="mt-2">Our platform is built on the core principles of privacy and user control. We are:</p>
        <ul className="list-disc list-inside ml-4 mt-2 mb-2">
          <li><b>Non-Custodial:</b> We never take control of your crypto assets. You are always in full control of your private keys and funds.</li>
          <li><b>No-KYC:</b> We do not require you to submit any "Know Your Customer" (KYC) documentation, such as passports, driver's licenses, or utility bills.</li>
        </ul>
        <p>This Privacy Policy explains how we handle your information when you use our platform. By using our services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy.</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information We Do Not Collect</h2>
        <p>We believe in data minimization and only collect what is absolutely necessary to facilitate your trades. We <b>DO NOT</b> collect or store:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Your full name, physical address, or date of birth.</li>
          <li>Government-issued identification documents.</li>
          <li>Your IP address for tracking purposes.</li>
          <li>Your transaction history on the blockchain, other than what is publicly available.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
        <p>The only information we collect is the data you voluntarily provide during a trade. This is limited to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><b>Screenshots:</b> For the sole purpose of verifying payment and trade completion, we temporarily store a screenshot of the transaction confirmation.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
        <p>We use the limited information we collect for the following purposes:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><b>To Facilitate Trades:</b> The screenshot you provide is used to confirm that the terms of the trade have been met by both parties.</li>
          <li><b>To Resolve Disputes:</b> In the rare event of a trade dispute, the temporary screenshot may be used as evidence to help mediate and resolve the issue.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Retention and Deletion</h2>
        <p>We are committed to not holding your data for any longer than is strictly necessary.</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><b>Temporary Storage:</b> Screenshots are stored securely on our servers for the duration of the trade.</li>
          <li><b>Automatic Deletion:</b> Once the trade is successfully completed and confirmed by both parties, the screenshot is permanently and irretrievably deleted from our servers within 24 hours.</li>
          <li><b>In Case of Dispute:</b> If a trade dispute is initiated, the screenshot will be retained until the dispute is resolved, at which point it will be permanently deleted.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Security</h2>
        <p>We take the security of your data seriously. We implement a variety of security measures to maintain the safety of your information, including:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><b>Encryption:</b> All data, including the temporary screenshots, is encrypted both in transit and at rest.</li>
          <li><b>Access Controls:</b> Strict access controls are in place to ensure that only authorized personnel can access the temporary data for the purposes outlined in this policy.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cookies and Tracking Technologies</h2>
        <p>We may use cookies and similar tracking technologies to enhance your experience on our platform. These are used for essential functions such as maintaining your session and preferences. You can control the use of cookies at the individual browser level.</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
        <p>We do not share your information with any third-party services for marketing or tracking purposes. We may use third-party services for infrastructure and to ensure the smooth operation of our platform, but these services do not have access to any personal information you provide.</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Rights</h2>
        <p>As we do not collect personal information, the traditional rights of access, rectification, and erasure may not apply. However, you have the right to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><b>Be Informed:</b> To be informed about how your data is handled, as outlined in this policy.</li>
          <li><b>Lodge a Complaint:</b> To lodge a complaint with us if you have concerns about our privacy practices.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@rampz.io" className="text-emerald-400 underline">support@rampz.io</a>.</p>
      </section>
    </main>
  </>
);

export default PrivacyPolicy; 