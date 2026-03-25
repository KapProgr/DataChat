"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  code?: string;
}

interface DashboardState {
  // File state
  fileId: string | null;
  fileName: string;
  previewData: any[];
  headers: string[];
  // Chat state
  messages: Message[];
  // Chart state
  chartData: any;
  chartType: string;
}

interface DashboardContextType extends DashboardState {
  setFileData: (data: {
    fileId: string;
    fileName: string;
    previewData: any[];
    headers: string[];
  }) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setChartData: (data: any, type: string) => void;
  resetDashboard: () => void;
  clearSession: () => void;
}

const initialState: DashboardState = {
  fileId: null,
  fileName: "",
  previewData: [],
  headers: [],
  messages: [
    {
      role: "assistant",
      content:
        'Hi! Ask me anything about your data. For example: "Show me profit by month" or "What are the top 5 products?"',
    },
  ],
  chartData: null,
  chartType: "",
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

const STORAGE_KEY = "excel_killer_dashboard_session";

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from sessionStorage on mount (sessionStorage clears when browser closes)
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...initialState,
          ...parsed,
          // Ensure messages always has at least the welcome message
          messages: parsed.messages?.length > 0 ? parsed.messages : initialState.messages,
        });
      } catch (err) {
        console.error("Error loading dashboard session:", err);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (isHydrated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const setFileData = (data: {
    fileId: string;
    fileName: string;
    previewData: any[];
    headers: string[];
  }) => {
    setState((prev) => ({
      ...prev,
      fileId: data.fileId,
      fileName: data.fileName,
      previewData: data.previewData,
      headers: data.headers,
      // Reset chat and chart for new file
      messages: initialState.messages,
      chartData: null,
      chartType: "",
    }));
  };

  const addMessage = (message: Message) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const setMessages = (messages: Message[]) => {
    setState((prev) => ({
      ...prev,
      messages,
    }));
  };

  const setChartData = (data: any, type: string) => {
    setState((prev) => ({
      ...prev,
      chartData: data,
      chartType: type,
    }));
  };

  const resetDashboard = () => {
    setState(initialState);
  };

  const clearSession = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        setFileData,
        addMessage,
        setMessages,
        setChartData,
        resetDashboard,
        clearSession,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
