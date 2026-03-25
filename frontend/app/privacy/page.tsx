"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-purple-300 mb-8">Last updated: December 18, 2025</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-purple-200 leading-relaxed">
                DataChat ("we", "our", or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our AI-powered data analysis service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc list-inside text-purple-200 space-y-1">
                <li>Email address (for account creation)</li>
                <li>Name (optional)</li>
                <li>Payment information (processed securely via Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Usage Data</h3>
              <ul className="list-disc list-inside text-purple-200 space-y-1">
                <li>Files you upload for analysis</li>
                <li>Queries you submit</li>
                <li>Analysis results and generated visualizations</li>
                <li>Log data (IP address, browser type, access times)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-purple-200 leading-relaxed">We use your information to:</p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>Provide and maintain our Service</li>
                <li>Process your data queries and generate insights</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates about the Service</li>
                <li>Improve and optimize our Service</li>
                <li>Respond to customer support requests</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Storage and Security</h2>
              <p className="text-purple-200 leading-relaxed">
                <strong className="text-white">File Storage:</strong> Uploaded files are processed in memory 
                and metadata is stored in our secure database. Files are associated with your account 
                and can be deleted at any time.
              </p>
              <p className="text-purple-200 leading-relaxed mt-2">
                <strong className="text-white">Encryption:</strong> All data is encrypted in transit using 
                TLS/SSL. Sensitive data is encrypted at rest.
              </p>
              <p className="text-purple-200 leading-relaxed mt-2">
                <strong className="text-white">Retention:</strong> We retain your data for as long as your 
                account is active. Deleted files are soft-deleted and permanently removed after 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. AI Processing</h2>
              <p className="text-purple-200 leading-relaxed">
                Your queries and data are processed by AI models to generate insights. We use:
              </p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>Large Language Models (LLMs) for natural language understanding</li>
                <li>Code generation for data analysis</li>
                <li>Secure sandboxed execution environments</li>
              </ul>
              <p className="text-purple-200 leading-relaxed mt-2">
                Your data is not used to train AI models unless you explicitly opt-in.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Services</h2>
              <p className="text-purple-200 leading-relaxed">We use the following third-party services:</p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li><strong className="text-white">Clerk:</strong> Authentication and user management</li>
                <li><strong className="text-white">Stripe:</strong> Payment processing</li>
                <li><strong className="text-white">Supabase:</strong> Database and storage</li>
                <li><strong className="text-white">Vercel:</strong> Hosting and deployment</li>
              </ul>
              <p className="text-purple-200 leading-relaxed mt-2">
                Each service has its own privacy policy governing their data practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Sharing</h2>
              <p className="text-purple-200 leading-relaxed">
                We do <strong className="text-white">NOT</strong> sell your personal data. We may share 
                data only in these circumstances:
              </p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>With service providers who assist in operating our Service</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights or safety</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
              <p className="text-purple-200 leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li><strong className="text-white">Access:</strong> Request a copy of your data</li>
                <li><strong className="text-white">Delete:</strong> Request deletion of your account and data</li>
                <li><strong className="text-white">Export:</strong> Download your data in a portable format</li>
                <li><strong className="text-white">Correct:</strong> Update inaccurate information</li>
                <li><strong className="text-white">Opt-out:</strong> Unsubscribe from marketing emails</li>
              </ul>
              <p className="text-purple-200 leading-relaxed mt-2">
                To exercise these rights, contact us at{" "}
                <a href="mailto:privacy@datachat.app" className="text-purple-400 hover:text-purple-300 underline">
                  privacy@datachat.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Cookies</h2>
              <p className="text-purple-200 leading-relaxed">
                We use essential cookies for authentication and session management. We do not use 
                tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
              <p className="text-purple-200 leading-relaxed">
                Our Service is not intended for users under 13 years of age. We do not knowingly 
                collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. International Users</h2>
              <p className="text-purple-200 leading-relaxed">
                If you are accessing our Service from outside the United States, please be aware 
                that your data may be transferred to and processed in the United States or other 
                countries where our servers are located.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p className="text-purple-200 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="text-purple-200 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc list-inside text-purple-200 mt-2 space-y-1">
                <li>
                  Email:{" "}
                  <a href="mailto:privacy@datachat.app" className="text-purple-400 hover:text-purple-300 underline">
                    privacy@datachat.app
                  </a>
                </li>
                <li>
                  Support:{" "}
                  <a href="mailto:support@datachat.app" className="text-purple-400 hover:text-purple-300 underline">
                    support@datachat.app
                  </a>
                </li>
              </ul>
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
