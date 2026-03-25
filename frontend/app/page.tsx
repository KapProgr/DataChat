"use client";

import Link from "next/link";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight, Sparkles, BarChart3, MessageSquare, Zap, Shield, TrendingUp, Check } from "lucide-react";
import CookieConsent from "@/components/CookieConsent";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-lg bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DataChat</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Show different buttons based on auth state */}
              {!isLoaded ? (
                <div className="w-20 h-8 bg-white/10 rounded animate-pulse" />
              ) : (
                <>
                  <SignedOut>
                    <Link
                      href="/sign-in"
                      className="text-purple-200 hover:text-white transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
                    >
                      Get Started
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/dashboard"
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
                    >
                      Go to Dashboard
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-sm text-purple-200">AI-Powered Data Analysis</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Wrestling with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {" "}Excel{" "}
              </span>
              Spreadsheets
            </h1>

            <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
              Ask questions in plain English. Get instant insights, beautiful charts, 
              and data analysis powered by AI. No formulas needed.
            </p>

            {/* CTA Buttons - different for signed in/out */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold text-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold text-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Open Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>

            <p className="text-purple-300 text-sm mt-6">
              Free tier available • No credit card required
            </p>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
              <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-lg p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-20 h-20 text-purple-300 mx-auto mb-4" />
                  <p className="text-white text-xl font-semibold">Interactive Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Why DataChat?
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              The fastest way from data to insights. Built for modern teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Natural Language</h3>
              <p className="text-purple-200">
                Ask questions like &quot;Show me profit by month&quot; - no complex formulas or SQL needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Analysis</h3>
              <p className="text-purple-200">
                Get answers in seconds, not hours. AI generates Python code and executes it safely.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Beautiful Charts</h3>
              <p className="text-purple-200">
                Automatically creates bar, line, pie, and scatter charts based on your data.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Private</h3>
              <p className="text-purple-200">
                Your data is encrypted and never shared. Code runs in isolated sandbox environments.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-pink-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Insights</h3>
              <p className="text-purple-200">
                AI understands context and suggests relevant analyses based on your data structure.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-red-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Multiple Formats</h3>
              <p className="text-purple-200">
                Upload CSV, Excel, or any tabular data. Works with millions of rows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Kill Excel?
          </h2>
          <p className="text-xl text-purple-200 mb-10">
            Join thousands of analysts who&apos;ve ditched spreadsheets for AI
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold text-lg gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold text-lg gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">DataChat</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/faq" className="text-purple-300 hover:text-white text-sm transition">
                FAQ
              </Link>
              <Link href="/contact" className="text-purple-300 hover:text-white text-sm transition">
                Contact
              </Link>
              <Link href="/terms" className="text-purple-300 hover:text-white text-sm transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-purple-300 hover:text-white text-sm transition">
                Privacy Policy
              </Link>
            </div>
            
            <p className="text-purple-300 text-sm">
              © 2025 DataChat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}