"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import html2canvas from "html2canvas";
import FileUpload from "@/components/dashboard/FileUpload";
import ChatInterface from "@/components/dashboard/ChatInterface";
import ChartDisplay from "@/components/dashboard/ChartDisplay";
import DataPreview from "@/components/dashboard/DataPreview";
import { useDashboard } from "@/components/providers/DashboardContext";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function DashboardPage() {
  const { user } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Use global dashboard state
  const {
    fileId,
    fileName,
    previewData,
    headers,
    chartData,
    chartType,
    setFileData,
    setChartData,
    resetDashboard,
  } = useDashboard();

  // Initialize user via backend
  useEffect(() => {
    const initUser = async () => {
      if (user) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/user/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_id: user.id,
              email: user.emailAddresses[0]?.emailAddress || "",
              name: user.fullName || null,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            console.error("Failed to sync user");
          }
        } catch (err) {
          console.error("Error syncing user:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    initUser();
  }, [user]);

  const handleFileUploaded = (data: any) => {
    setFileData({
      fileId: data.file_id,
      fileName: data.filename,
      previewData: data.preview,
      headers: data.headers,
    });
    toast.success("File uploaded successfully!");
  };

  const handleQueryResult = (data: any, type: string) => {
    setChartData(data, type);
  };

  const handleReset = () => {
    resetDashboard();
  };

  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value).replace(/\r?\n|\r/g, " ");
    if (/[",]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExportCsv = () => {
    if (!chartData) {
      toast.error("No analysis results to export");
      return;
    }

    const rows = Array.isArray(chartData) ? chartData : [chartData];
    if (rows.length === 0) {
      toast.error("No analysis results to export");
      return;
    }

    const headersSet = new Set<string>();
    rows.forEach((row) => {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        Object.keys(row).forEach((key) => headersSet.add(key));
      }
    });

    const headers = headersSet.size > 0 ? Array.from(headersSet) : ["value"];

    const csvLines = [
      headers.join(","),
      ...rows.map((row) => {
        if (row && typeof row === "object" && !Array.isArray(row)) {
          return headers.map((header) => escapeCsvValue((row as Record<string, unknown>)[header])).join(",");
        }
        return escapeCsvValue(row);
      }),
    ];

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const fileBaseName = (fileName || "analysis_results").replace(/\.[^/.]+$/, "");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}_analysis_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const handleExportPng = async () => {
    if (!chartRef.current) {
      toast.error("No chart to export");
      return;
    }

    try {
      toast.loading("Generating chart image...");

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      const fileBaseName = (fileName || "analysis_results").replace(/\.[^/.]+$/, "");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `${fileBaseName}_chart_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success("Chart exported as PNG");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to export chart image");
      console.error("PNG export error:", error);
    }
  };

  if (!user) {
    return <DashboardSkeleton />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Unable to load user</div>
          <button 
            onClick={() => window.location.reload()}
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Data Analysis
        </h1>
        <p className="text-purple-200">
          Upload your data and ask questions in natural language
        </p>
      </div>

      {/* Upload Section */}
      {!fileId ? (
        <FileUpload 
          userId={user.id} 
          onFileUploaded={handleFileUploaded} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Data Preview + Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    📊 {fileName}
                  </h2>
                  <p className="text-purple-200 text-sm">
                    {previewData.length} rows × {headers.length} columns
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
                >
                  New File
                </button>
              </div>
            </div>

            {/* Data Preview */}
            <DataPreview data={previewData} headers={headers} />

            {/* Results */}
            {chartData && chartType && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {chartType === "table" ? "📋 Analysis Results" : "📈 Visualization"}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-2 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-lg transition"
                    >
                      Export CSV
                    </button>
                    {chartType !== "table" && (
                      <button
                        onClick={handleExportPng}
                        className="px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition"
                      >
                        Export PNG
                      </button>
                    )}
                  </div>
                </div>
                <div ref={chartRef}>
                  <ChartDisplay data={chartData} type={chartType} />
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat Interface */}
          <div className="lg:col-span-1">
            <ChatInterface
              fileId={fileId}
              userId={user.id}
              onQueryResult={handleQueryResult}
            />
          </div>
        </div>
      )}
    </div>
  );
}