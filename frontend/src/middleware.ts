import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isProfilePage = request.nextUrl.pathname.startsWith('/profile');

  // Redirect to login if accessing protected route without token
  if (isProfilePage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
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