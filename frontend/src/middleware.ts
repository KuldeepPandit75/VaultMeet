import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || localStorage.getItem('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isProfilePage = request.nextUrl.pathname.startsWith('/profile');

  // Redirect to login if accessing protected route without token
  if (isProfilePage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token with backend for profile pages
  if (isProfilePage && token) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If token is invalid, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If verification fails, redirect to login
      console.log(error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to home if accessing auth pages with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/login', '/register']
}; 