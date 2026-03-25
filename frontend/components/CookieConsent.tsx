"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay before showing banner
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-slate-800/95 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center flex-shrink-0">
            <Cookie className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">🍪 Cookie Settings</h3>
            <p className="text-purple-200/80 text-sm leading-relaxed">
              We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
              By clicking "Accept All", you consent to our use of cookies. 
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline ml-1">
                Learn more
              </Link>
            </p>
          </div>

          <button
            onClick={declineCookies}
            className="text-gray-400 hover:text-white transition p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:justify-end">
          <button
            onClick={declineCookies}
            className="px-6 py-2.5 text-sm font-medium text-purple-200 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-500 hover:to-pink-500 transition shadow-lg"
          >
            Accept All
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
