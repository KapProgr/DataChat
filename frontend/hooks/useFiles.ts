"use client";

import { useEffect, useState } from "react";
import { getUserFiles, type FileRecord } from "@/lib/supabase";

export function useFiles(userId: string | null | undefined) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    getUserFiles(userId)
      .then((data) => setFiles(data))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        setError(err.message || "Failed to load files");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { files, loading, error, setFiles };
}


