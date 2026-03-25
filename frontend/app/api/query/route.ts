import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { detail: "Backend URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Query proxy failed" },
      { status: 500 }
    );
  }
}


