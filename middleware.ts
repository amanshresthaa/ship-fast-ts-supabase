import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The middleware is used to refresh the user's session before loading Server Component routes
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Optional: Add session-based redirects
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/signin', req.url));
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Configure middleware to only run on specific paths that need authentication
// This improves performance by not running the middleware on all routes
export const config = {
  matcher: [
    // Only match routes that need auth session
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/quiz-test/:path*',
    
    // Exclude static files, images, and API routes that don't need auth
    '/((?!api/health|api/webhook|quiz-cached|quiz-optimized|api/quiz/cached|api/admin/cache|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
  ],
}
