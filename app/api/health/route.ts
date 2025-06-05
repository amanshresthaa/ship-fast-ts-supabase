import { NextResponse } from "next/server";

export const runtime = 'edge';

// Simple health check endpoint for Vercel monitoring
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "unknown"
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
