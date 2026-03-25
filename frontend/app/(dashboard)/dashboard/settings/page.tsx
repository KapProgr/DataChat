"use client";

import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { Crown, Zap, Check, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import { SettingsPageSkeleton } from "@/components/ui/Skeleton";
import { useSearchParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const FREE_LIMITS = {
  uploads: 10,
  queries: 50,
};

function SettingsContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState({ uploads: 0, queries: 0 });
  const [isPro, setIsPro] = useState<boolean | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadUsage();
    if (searchParams.get("success") === "true") {
      toast.success("🎉 Welcome to Pro! Your subscription is now active.");
      setTimeout(() => loadUsage(), 1000);
    } else if (searchParams.get("canceled") === "true") {
      toast.error("Checkout was canceled.");
    }
  }, [user, searchParams]);

  const loadUsage = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const usageRes = await fetch(`${BACKEND_URL}/api/usage?user_id=${user.id}`);
      const usageData = await usageRes.json();
      setUsage({ 
        uploads: usageData.uploads_today || 0, 
        queries: usageData.queries_today || 0 
      });
      setIsPro(usageData.is_pro || false);
    } catch (err) {
      console.error("Failed to load usage:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/billing", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to open billing portal");
      }
    } catch (err: any) {
      console.error("Billing error:", err);
      toast.error(err.message || "Failed to open billing portal");
    }
  };

  const uploadPercent = Math.min((usage.uploads / FREE_LIMITS.uploads) * 100, 100);
  const queryPercent = Math.min((usage.queries / FREE_LIMITS.queries) * 100, 100);

  if (loading || isPro === null) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-purple-200">Manage your account and subscription</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className={`backdrop-blur-lg rounded-xl p-6 border ${isPro ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50' : 'bg-white/10 border-white/20'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPro ? 'bg-yellow-500/20' : 'bg-purple-500/20'}`}>
                <Crown className={`w-6 h-6 ${isPro ? 'text-yellow-400' : 'text-purple-300'}`} />
              </div>
              <div>
                <p className="text-purple-200 text-sm">Current Plan</p>
                <p className="text-xl font-bold text-white">{isPro ? 'Pro' : 'Free Tier'}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {isPro ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Unlimited uploads</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Unlimited queries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Priority support</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>10 file uploads/day</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>50 queries/day</span>
                  </div>
                </>
              )}
            </div>

            {isPro ? (
              <button 
                onClick={handleManageSubscription}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-semibold"
              >
                Manage Subscription
              </button>
            ) : (
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {upgrading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

          {!isPro && (
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/50">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-yellow-400" />
                <p className="text-lg font-bold text-white">Pro Plan</p>
              </div>
              <p className="text-2xl font-bold text-white mb-1">$9.99/month</p>
              <p className="text-purple-200 text-sm mb-4">Everything you need</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Unlimited uploads</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Unlimited queries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-bold text-white">Today's Usage</p>
              <button onClick={loadUsage} disabled={loading} className="text-purple-300 hover:text-white transition">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-200">Uploads</span>
                  <span className="text-white">{usage.uploads} / {isPro ? '∞' : FREE_LIMITS.uploads}</span>
                </div>
                {!isPro && (
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${uploadPercent >= 90 ? 'bg-red-500' : 'bg-purple-600'}`} style={{ width: `${uploadPercent}%` }} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-200">Queries</span>
                  <span className="text-white">{usage.queries} / {isPro ? '∞' : FREE_LIMITS.queries}</span>
                </div>
                {!isPro && (
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${queryPercent >= 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${queryPercent}%` }} />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-purple-300 mt-4">Resets daily at midnight UTC</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none",
                  navbar: "hidden",
                  pageScrollBox: "p-0",
                  profileSection: "border-white/10",
                  profileSectionTitle: "text-white",
                  profileSectionContent: "text-purple-200",
                  formFieldLabel: "text-purple-200",
                  formFieldInput: "bg-white/10 border-white/20 text-white",
                  formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
                  badge: "bg-purple-500/20 text-purple-200",
                  headerTitle: "text-white",
                  headerSubtitle: "text-purple-200",
                },
              }}
            />
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <div>
                  <p className="text-white font-medium">Clear All Data</p>
                  <p className="text-sm text-purple-200">Permanently delete all your files and queries</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure? This cannot be undone.")) return;
                    try {
                      await fetch(`${BACKEND_URL}/api/files?user_id=${user?.id}`, { method: "DELETE" });
                      toast.success("All data cleared");
                      loadUsage();
                    } catch (err) {
                      toast.error("Failed to clear data");
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition text-sm font-medium"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
