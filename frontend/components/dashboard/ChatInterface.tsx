"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Code } from "lucide-react";
import { useDashboard } from "@/components/providers/DashboardContext";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  code?: string;
}

interface ChatInterfaceProps {
  fileId: string;
  userId: string;
  onQueryResult: (data: any, type: string) => void;
}

export default function ChatInterface({
  fileId,
  userId,
  onQueryResult,
}: ChatInterfaceProps) {
  // Use global messages state from context
  const { messages, addMessage } = useDashboard();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMessage });
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileId,
          query: userMessage,
          user_id: userId,
          chat_history: messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Query failed");
      }

      const data = await response.json();

      // Format result data for display in chat
      let resultText = data.answer;
      if (data.data && data.data.length > 0) {
        const firstItem = data.data[0];
        const isTabularResult = firstItem && typeof firstItem === "object" && !("name" in firstItem) && !("value" in firstItem);

        if (isTabularResult) {
          resultText += `\n\n📊 Returned ${data.data.length.toLocaleString()} rows. See the table/chart panel for the full result.`;
        } else {
          resultText += "\n\n📊 Results:\n";
          data.data.slice(0, 10).forEach((item: any, idx: number) => {
            if (item.name && item.value !== undefined) {
              resultText += `${idx + 1}. ${item.name}: ${typeof item.value === 'number' ? item.value.toLocaleString() : item.value}\n`;
            } else if (item.value !== undefined) {
              resultText += `${idx + 1}. ${typeof item.value === 'number' ? item.value.toLocaleString() : item.value}\n`;
            } else {
              const keys = Object.keys(item).slice(0, 3);
              const values = keys.map(k => `${k}: ${item[k]}`).join(', ');
              resultText += `${idx + 1}. ${values}\n`;
            }
          });
          if (data.data.length > 10) {
            resultText += `\n... and ${data.data.length - 10} more rows`;
          }
        }
      }

      addMessage({
        role: "assistant",
        content: resultText,
        code: data.generated_code,
      });

      if (data.data && data.data.length > 0) {
        const resultType = data.chart_type && data.chart_type !== "none"
          ? data.chart_type
          : "table";
        onQueryResult(data.data, resultType);
      }

      toast.success("Analysis complete!");
    } catch (err: any) {
      console.error("Query error:", err);
      addMessage({
        role: "assistant",
        content: `Error: ${err.message || "Something went wrong"}`,
      });
      toast.error(err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 flex flex-col h-[calc(100vh-12rem)] sticky top-8">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Bot className="w-5 h-5 mr-2 text-purple-300" />
          AI Assistant
        </h3>
        <p className="text-xs text-purple-300 mt-1">
          Ask questions in natural language
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white/20 text-white"
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>

              {msg.code && (
                <details className="mt-2 bg-black/30 rounded p-2">
                  <summary className="cursor-pointer text-xs text-purple-300 flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    View Generated Code
                  </summary>
                  <pre className="text-xs text-green-300 mt-2 overflow-x-auto">
                    {msg.code}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-300" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data..."
            className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}