"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What file formats does DataChat support?",
        a: "DataChat supports CSV (.csv) and Excel (.xlsx, .xls) files. We can handle files up to 10MB in size with up to 100,000 rows of data.",
      },
      {
        q: "How do I upload my data?",
        a: "Simply drag and drop your file onto the upload area in the dashboard, or click to browse and select your file. Your data will be processed automatically and ready for querying in seconds.",
      },
      {
        q: "Do I need to know SQL or programming?",
        a: "Not at all! DataChat uses AI to understand plain English questions. Just ask questions like 'What were the total sales last month?' or 'Show me the top 10 customers by revenue' and get instant answers.",
      },
    ],
  },
  {
    category: "Pricing & Plans",
    questions: [
      {
        q: "What's included in the Free plan?",
        a: "The Free plan includes 10 file uploads and 50 AI queries per day. You get access to all basic features including chart generation and data analysis.",
      },
      {
        q: "What additional features do I get with Pro?",
        a: "Pro users ($9.99/month) get unlimited uploads and queries, priority AI processing, advanced chart types, and the ability to export reports. You also get priority email support.",
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes! You can cancel your Pro subscription at any time from the Settings page. You'll continue to have Pro access until the end of your billing period.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a full refund within 7 days of your first Pro subscription if you're not satisfied. Contact us at support@datachat.app for refund requests.",
      },
    ],
  },
  {
    category: "Data & Privacy",
    questions: [
      {
        q: "Is my data secure?",
        a: "Absolutely. We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Your files are stored securely and are never shared with third parties.",
      },
      {
        q: "How long do you keep my data?",
        a: "Your uploaded files are retained for 30 days for Free users and 90 days for Pro users. You can delete your files at any time from the Files page in your dashboard.",
      },
      {
        q: "Can I delete my account and all data?",
        a: "Yes, you can request complete account deletion from the Settings page or by contacting support. All your data will be permanently removed within 48 hours.",
      },
      {
        q: "Do you use my data to train AI models?",
        a: "No. Your data is never used to train our AI models or shared with any third parties. It's only used to answer your specific queries.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        q: "What happens if my query doesn't work?",
        a: "If the AI doesn't understand your query, try rephrasing it or being more specific about the columns you want to analyze. You can also check the data preview to see your column names.",
      },
      {
        q: "Can I export my analysis results?",
        a: "Pro users can export charts as PNG images and data results as CSV files. We're working on PDF report export coming soon!",
      },
      {
        q: "Is there an API available?",
        a: "We're working on a public API for enterprise customers. Contact us at support@datachat.app if you're interested in API access.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-white transition"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-purple-200/80 leading-relaxed animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-purple-200 text-lg">
            Can't find what you're looking for?{" "}
            <Link href="/contact" className="text-purple-400 hover:text-white underline">
              Contact us
            </Link>
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category) => (
            <div
              key={category.category}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {category.category}
              </h2>
              <div>
                {category.questions.map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-purple-200 mb-6">
            Our support team is here to help you get the most out of DataChat.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition"
          >
            Contact Support
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
