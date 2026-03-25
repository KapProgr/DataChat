"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FileSpreadsheet, Trash2, Download, Calendar, Database, Upload, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";
import { FilesPageSkeleton } from "@/components/ui/Skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface FileRecord {
  id: string;
  filename?: string;
  file_name?: string;
  file_url?: string;
  rows?: number;
  row_count?: number;
  columns?: number;
  column_count?: number;
  file_size?: number;
  created_at: string;
  user_id?: string;
}

export default function FilesPage() {
  const { user } = useUser();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load files on mount and when user changes
  useEffect(() => {
    loadFiles();
  }, [user]);

  // Refetch when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFiles();
      }
    };
    
    const handleFocus = () => {
      loadFiles();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend with cache-busting
      const url = user
        ? `${BACKEND_URL}/api/files?user_id=${user.id}&_t=${Date.now()}`
        : `${BACKEND_URL}/api/files?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load files");
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete file");
      
      setFiles(files.filter((f) => f.id !== fileId));
      toast.success("File deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return <FilesPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={loadFiles}
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
          <h1 className="text-3xl font-bold text-white mb-2">My Files</h1>
          <p className="text-purple-200">Manage your uploaded data files</p>
        </div>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
        >
          Upload New File
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total Files</p>
              <p className="text-2xl font-bold text-white">{files.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Total Size</p>
              <p className="text-2xl font-bold text-white">
                {formatBytes(files.reduce((acc, f) => acc + f.file_size, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">
                {files.filter((f) => {
                  const fileDate = new Date(f.created_at);
                  const now = new Date();
                  return (
                    fileDate.getMonth() === now.getMonth() &&
                    fileDate.getFullYear() === now.getFullYear()
                  );
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        {files.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No files yet</h3>
            <p className="text-purple-200 mb-6 max-w-md mx-auto">
              Upload your first CSV or Excel file to start analyzing your data with AI
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition font-semibold"
            >
              <Upload className="w-5 h-5" />
              Upload Your First File
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4 text-purple-300 font-semibold">File Name</th>
                  <th className="text-left p-4 text-purple-300 font-semibold">Size</th>
                  <th className="text-left p-4 text-purple-300 font-semibold">Rows</th>
                  <th className="text-left p-4 text-purple-300 font-semibold">Columns</th>
                  <th className="text-left p-4 text-purple-300 font-semibold">Uploaded</th>
                  <th className="text-left p-4 text-purple-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-purple-300" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{file.filename || file.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-white">{file.file_size ? formatBytes(file.file_size) : '-'}</td>
                    <td className="p-4 text-white">{(file.rows || file.row_count || 0).toLocaleString()}</td>
                    <td className="p-4 text-white">{file.columns || file.column_count || 0}</td>
                    <td className="p-4 text-purple-200 text-sm">
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={file.file_url}
                          download
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}