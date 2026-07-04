import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    API_BASE_URL: process.env.API_BASE_URL ? "✅ definida" : "❌ no definida",
    SESSION_SECRET: process.env.SESSION_SECRET ? "✅ definida" : "❌ no definida",
  });
}
