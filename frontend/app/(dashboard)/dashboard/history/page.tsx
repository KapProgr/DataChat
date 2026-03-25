"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare, Calendar, FileSpreadsheet, Code, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";
import { HistoryPageSkeleton } from "@/components/ui/Skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface QueryRecord {
  id: string;
  file_id: string;
  filename?: string;
  file_name?: string;
  query?: string;
  query_text?: string;
  answer?: string;
  ai_response?: string;
  chart_type?: string;
  generated_code?: string;
  user_id?: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useUser();
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  useEffect(() => {
    loadHistory();
  }, [user, filter]);

  // Refetch when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadHistory();
      }
    };
    
    const handleFocus = () => {
      loadHistory();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend with cache-busting
      const url = user
        ? `${BACKEND_URL}/api/history?user_id=${user.id}&_t=${Date.now()}`
        : `${BACKEND_URL}/api/history?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const data = await response.json();
      let queriesList = data.queries || [];

      // Apply client-side filters
      if (filter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        queriesList = queriesList.filter((q: QueryRecord) => 
          new Date(q.created_at) >= today
        );
      } else if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        queriesList = queriesList.filter((q: QueryRecord) => 
          new Date(q.created_at) >= weekAgo
        );
      }

      setQueries(queriesList);
    } catch (err) {
      console.error(err);
      setError("Failed to load history");
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HistoryPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={loadHistory}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Query History</h1>
          <p className="text-purple-200">View all your past analyses</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "today", "week"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg transition font-medium capitalize ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total Queries</p>
              <p className="text-2xl font-bold text-white">{queries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Today</p>
              <p className="text-2xl font-bold text-white">
                {
                  queries.filter((q) => {
                    const queryDate = new Date(q.created_at);
                    const today = new Date();
                    return queryDate.toDateString() === today.toDateString();
                  }).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Files Analyzed</p>
              <p className="text-2xl font-bold text-white">
                {new Set(queries.map((q) => q.file_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-16 border border-white/20 text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No queries yet</h3>
            <p className="text-purple-200 mb-6 max-w-md mx-auto">
              Upload a file and start asking questions to see your analysis history here
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold"
            >
              <MessageSquare className="w-5 h-5" />
              Start Analyzing
            </Link>
          </div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-purple-300" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Query */}
                  <div className="mb-3">
                    <p className="text-sm text-purple-300 mb-1">Your Question:</p>
                    <p className="text-white font-medium">{query.query_text}</p>
                  </div>

                  {/* Response */}
                  <div className="mb-3">
                    <p className="text-sm text-purple-300 mb-1">AI Response:</p>
                    <p className="text-purple-100">{query.ai_response}</p>
                  </div>

                  {/* Code */}
                  {query.generated_code && (
                    <details className="mt-3 bg-black/30 rounded-lg p-3">
                      <summary className="cursor-pointer text-sm text-purple-300 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        View Generated Code
                      </summary>
                      <pre className="text-xs text-green-300 mt-2 overflow-x-auto">
                        {query.generated_code}
                      </pre>
                    </details>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-4 text-xs text-purple-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(query.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {query.chart_type && (
                      <span className="px-2 py-1 bg-purple-500/20 rounded">
                        {query.chart_type} chart
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}