const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn("[lib/api] NEXT_PUBLIC_BACKEND_URL is not set");
}

export interface BackendUploadResponse {
  file_id: string;
  filename: string;
  headers: string[];
  rows: number;
  columns: number;
  preview: any[];
  dtypes: Record<string, string>;
}

export interface BackendQueryResponse {
  answer: string;
  data?: any[];
  chart_type?: string;
  generated_code?: string;
}

export async function uploadToBackend(formData: FormData) {
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Upload failed");
  }

  return (await res.json()) as BackendUploadResponse;
}

export async function queryBackend(payload: {
  file_id: string;
  query: string;
  chat_history?: any[];
}) {
  const res = await fetch(`${BACKEND_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.detail || "Query failed");
  }

  return json as BackendQueryResponse;
}

export async function getFilePreview(fileId: string, rows = 100) {
  const res = await fetch(
    `${BACKEND_URL}/api/files/${encodeURIComponent(fileId)}/preview?rows=${rows}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to load file preview");
  }

  return res.json();
}

export async function getFileStats(fileId: string) {
  const res = await fetch(
    `${BACKEND_URL}/api/files/${encodeURIComponent(fileId)}/stats`,
    { method: "GET" }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to load file stats");
  }

  return res.json();
}

export async function deleteBackendFile(fileId: string) {
  const res = await fetch(
    `${BACKEND_URL}/api/files/${encodeURIComponent(fileId)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to delete file");
  }

  return res.json();
}


