import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

// The middleware is used to refresh the user's session before loading Server Component routes
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}

// Configure middleware to only run on specific paths that need authentication
// This improves performance by not running the middleware on all routes
export const config = {
  matcher: [
    // Only match routes that need auth session
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/quiz-test/:path*',
    '/api/user/:path*',
    '/api/stripe/:path*',
    
    // Don't run middleware on demo routes, static files, or cached routes
    // Removed the broad pattern that was causing issues
  ],
}
