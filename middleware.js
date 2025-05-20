```javascript
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
    // Updated path for protected quiz tests
    '/dev/quiz-test/:path*', 
    
    // Exclude public routes (like /quizzes), static assets, and specific API paths from session refresh.
    // Add other public top-level routes to this list as needed.
    '/((?!quizzes|api/quiz/cached|api/admin/cache|_next/static|_next/image|favicon.ico).*)'
  ],
}
```
