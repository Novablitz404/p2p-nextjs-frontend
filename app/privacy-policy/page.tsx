import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import { 
  Shield, 
  Eye, 
  Lock, 
  Trash2, 
  Cookie, 
  Users, 
  AlertTriangle, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

const PrivacyPolicy = () => (
  <>
    <AppHeader />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-4xl mx-auto px-6 py-16 text-white">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">
            Your privacy is our priority. We believe in transparency and data minimization.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last Updated: July 10, 2025</span>
          </div>
        </div>

        {/* Introduction Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Introduction</h2>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Welcome to <span className="text-emerald-400 font-semibold">Rampz</span> ("we," "us," or "our"). 
              We are committed to protecting your privacy and providing a secure, decentralized platform for 
              peer-to-peer (P2P) crypto-to-fiat and fiat-to-crypto transactions.
            </p>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Our platform is built on the core principles of privacy and user control. We are:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Non-Custodial</h3>
                  <p className="text-sm text-gray-400">
                    We never take control of your crypto assets. You are always in full control of your private keys and funds.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">No-KYC</h3>
                  <p className="text-sm text-gray-400">
                    We do not require you to submit any "Know Your Customer" (KYC) documentation, such as passports, driver's licenses, or utility bills.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mt-6 leading-relaxed">
              This Privacy Policy explains how we handle your information when you use our platform. 
              By using our services, you agree to the collection, use, and disclosure of your information 
              as described in this Privacy Policy.
            </p>
          </div>
        </section>

        {/* Information We Do NOT Collect */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl p-8 border border-red-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Information We Do NOT Collect</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We believe in data minimization and only collect what is absolutely necessary to facilitate your trades. 
              We <span className="text-red-400 font-bold">DO NOT</span> collect or store:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-gray-300">Your full name, physical address, or date of birth</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-gray-300">Government-issued identification documents</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-gray-300">Your IP address for tracking purposes</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-gray-300">Your transaction history on the blockchain</span>
              </div>
            </div>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Eye className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The only information we collect is the data you voluntarily provide during a trade. This is limited to:
            </p>
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Screenshots</h3>
                  <p className="text-gray-300 leading-relaxed">
                    For the sole purpose of verifying payment and trade completion, we temporarily store a screenshot 
                    of the transaction confirmation. This is the only personal data we collect and store.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We use the limited information we collect for the following purposes:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">To Facilitate Trades</h3>
                  <p className="text-gray-300">
                    The screenshot you provide is used to confirm that the terms of the trade have been met by both parties.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">To Resolve Disputes</h3>
                  <p className="text-gray-300">
                    In the rare event of a trade dispute, the temporary screenshot may be used as evidence to help mediate and resolve the issue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Retention and Deletion */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Trash2 className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Data Retention and Deletion</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We are committed to not holding your data for any longer than is strictly necessary.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Temporary Storage</h3>
                  <p className="text-gray-300">
                    Screenshots are stored securely on our servers for the duration of the trade.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Automatic Deletion</h3>
                  <p className="text-gray-300">
                    Once the trade is successfully completed and confirmed by both parties, the screenshot is permanently 
                    and irretrievably deleted from our servers within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">In Case of Dispute</h3>
                  <p className="text-gray-300">
                    If a trade dispute is initiated, the screenshot will be retained until the dispute is resolved, 
                    at which point it will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-emerald-500/20">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Data Security</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We take the security of your data seriously. We implement a variety of security measures to maintain 
              the safety of your information, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <Lock className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Encryption</h3>
                  <p className="text-sm text-gray-400">
                    All data, including the temporary screenshots, is encrypted both in transit and at rest.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Access Controls</h3>
                  <p className="text-sm text-gray-400">
                    Strict access controls are in place to ensure that only authorized personnel can access the temporary data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cookies and Tracking */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Cookie className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Cookies and Tracking Technologies</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We may use cookies and similar tracking technologies to enhance your experience on our platform. 
              These are used for essential functions such as maintaining your session and preferences. 
              You can control the use of cookies at the individual browser level.
            </p>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Third-Party Services</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We do not share your information with any third-party services for marketing or tracking purposes. 
              We may use third-party services for infrastructure and to ensure the smooth operation of our platform, 
              but these services do not have access to any personal information you provide.
            </p>
          </div>
        </section>

        {/* User Rights */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">User Rights</h2>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              As we do not collect personal information, the traditional rights of access, rectification, and erasure may not apply. 
              However, you have the right to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Be Informed</h3>
                  <p className="text-sm text-gray-400">
                    To be informed about how your data is handled, as outlined in this policy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Lodge a Complaint</h3>
                  <p className="text-sm text-gray-400">
                    To lodge a complaint with us if you have concerns about our privacy practices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Changes to This Privacy Policy</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 rounded-xl p-8 border border-emerald-600/50 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-emerald-500/20">
                <Mail className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Contact Us</h2>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <Mail className="h-5 w-5 text-emerald-400" />
              <a 
                href="mailto:support@rampz.io" 
                className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
              >
                support@rampz.io
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  </>
);

export default PrivacyPolicy; 