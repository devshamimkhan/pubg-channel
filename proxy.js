import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function proxy(req) {
  const path = req.nextUrl.pathname;
  
  // Public routes
  if (path === '/' || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const isAuthRoute = path === '/login' || path === '/register';
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If user is accessing login/register but already logged in, redirect to channel list
  if (isAuthRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/channels', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes protection
  if (path.startsWith('/admin')) {
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/channels', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
