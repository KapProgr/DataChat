"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-lg bg-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DataChat</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-purple-200 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-purple-300 mb-8">Last updated: December 18, 2025</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-purple-200 leading-relaxed">
                By accessing or using DataChat ("Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="text-purple-200 leading-relaxed">
                DataChat is an AI-powered data analysis platform that allows users to upload spreadsheet 
                files (CSV, Excel) and query their data using natural language. The Service generates 
                insights, visualizations, and analysis based on user queries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              <p className="text-purple-200 leading-relaxed">
                To use certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
              <p className="text-purple-200 leading-relaxed">You agree not to:</p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>Upload malicious files or content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service for any illegal purpose</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Upload data you do not have rights to use</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data and Privacy</h2>
              <p className="text-purple-200 leading-relaxed">
                Your use of the Service is also governed by our{" "}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>
                . By using the Service, you consent to the collection and use of your data as described therein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Subscription and Billing</h2>
              <p className="text-purple-200 leading-relaxed">
                <strong className="text-white">Free Tier:</strong> Limited to 10 file uploads and 50 queries per day.
              </p>
              <p className="text-purple-200 leading-relaxed mt-2">
                <strong className="text-white">Pro Plan ($9.99/month):</strong> Unlimited uploads and queries, 
                priority support, and advanced features.
              </p>
              <p className="text-purple-200 leading-relaxed mt-2">
                Subscriptions are billed monthly. You may cancel at any time, and your access will continue 
                until the end of your billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p className="text-purple-200 leading-relaxed">
                You retain all rights to your data. We do not claim ownership of any data you upload. 
                The Service, including its design, code, and branding, remains our intellectual property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-purple-200 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR 
                ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF 
                THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
              <p className="text-purple-200 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violations 
                of these Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
              <p className="text-purple-200 leading-relaxed">
                We may update these Terms from time to time. We will notify you of significant changes 
                by posting the new Terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="text-purple-200 leading-relaxed">
                If you have questions about these Terms, please contact us at{" "}
                <a href="mailto:support@datachat.app" className="text-purple-400 hover:text-purple-300 underline">
                  support@datachat.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-purple-300 text-sm">© 2025 DataChat. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-purple-300 hover:text-white text-sm transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-purple-300 hover:text-white text-sm transition">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
