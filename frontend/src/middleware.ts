import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isProfilePage = request.nextUrl.pathname === '/me';
  const isEventSpacePage = request.nextUrl.pathname.startsWith('/event-space');
  const isCodingSpacePage = request.nextUrl.pathname.startsWith('/coding-space');

  // Check if it's a protected route
  const isProtectedRoute = isProfilePage || isEventSpacePage || isCodingSpacePage;

  // Get backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token with backend for all protected routes
  if (isProtectedRoute && token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${backendUrl}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('Token verification failed, redirecting to login');
        // If token is invalid, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If verification fails, redirect to login
      console.log('Token verification error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to home if accessing auth pages with valid token
  if (isAuthPage && token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${backendUrl}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('User already authenticated, redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.log('Token verification failed for auth page:', error);
      // If verification fails, continue to auth page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/me', '/login', '/register', '/event-space/:path*', '/coding-space/:path*']
}; 