import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isProfilePage = request.nextUrl.pathname === '/me';

  // Redirect to login if accessing protected route without token
  if (isProfilePage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token with backend for profile pages
  if (isProfilePage && token) {
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

  // Redirect to home if accessing auth pages with token
  if (isAuthPage && token) {
    console.log('hld')
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/me', '/login', '/register']
}; 