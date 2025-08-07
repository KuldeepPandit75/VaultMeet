import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isProfilePage = request.nextUrl.pathname === '/me';
  const isEventSpacePage = request.nextUrl.pathname.startsWith('/event');
  const isCodingSpacePage = request.nextUrl.pathname.startsWith('/room');

  // Check if it's a protected route
  const isProtectedRoute = isProfilePage || isEventSpacePage || isCodingSpacePage;

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token with backend for all protected routes
  if (isProtectedRoute && token) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('Token is invalid');
        // If token is invalid, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If verification fails, redirect to login
      console.log(error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to home if accessing auth pages with valid token
  if (isAuthPage && token) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('User already authenticated, redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.log('Token verification failed for auth page:', error);
      // If verification fails, continue to auth page
    }
  }
  const res = NextResponse.next();
  // Disable cache
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ['/me', '/login', '/register', '/event-space/:path*', '/room/:path*']
}; 