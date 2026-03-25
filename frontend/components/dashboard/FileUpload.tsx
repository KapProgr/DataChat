"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Loader2, Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface FileUploadProps {
  userId: string;
  onFileUploaded: (data: any) => void;
}

export default function FileUpload({ userId, onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error("Please upload CSV or Excel files only");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }

    setUploading(true);

    try {
      // Send file directly to backend
      const formData = new FormData();
      formData.append("file", file);
      if (userId) {
        formData.append("user_id", userId);
      }
      console.log("Uploading with userId:", userId);

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      const data = await response.json();
      
      toast.success(`File uploaded successfully! ${data.rows} rows, ${data.columns} columns`);
      onFileUploaded(data);
      
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome Message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm text-purple-200">AI-Powered Analysis</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Welcome to DataChat! 👋
        </h2>
        <p className="text-purple-200 text-lg">
          Upload your first file to start asking questions about your data
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border-2 border-dashed transition-all ${
          dragActive
            ? "border-purple-400 bg-purple-500/20 scale-[1.02]"
            : "border-white/30 hover:border-purple-400/50 hover:bg-white/[0.15]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center mb-6 ring-4 ring-purple-500/20">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-purple-300 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-10 h-10 text-purple-300" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            {uploading ? "Analyzing your data..." : "Drop your file here"}
          </h3>
          <p className="text-purple-200 mb-6">
            {uploading 
              ? "This usually takes a few seconds" 
              : "or click to browse from your computer"}
          </p>

          <label className="cursor-pointer inline-block">
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              disabled={uploading}
            />
            <div className={`inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition font-semibold text-lg shadow-lg shadow-purple-500/25 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? "Uploading..." : "Upload Your First CSV"}
              {!uploading && <ArrowRight className="w-5 h-5 ml-2" />}
            </div>
          </label>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-purple-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              CSV
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Excel (.xlsx)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Up to 100MB
            </span>
          </div>
        </div>
      </div>

      {/* Example Questions */}
      <div className="mt-8 text-center">
        <p className="text-purple-300 text-sm mb-3">Once uploaded, you can ask questions like:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "What are the top 5 products?",
            "Show me sales by month",
            "Compare revenue by region"
          ].map((q, i) => (
            <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-purple-200">
              "{q}"
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}