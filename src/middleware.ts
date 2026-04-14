import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApi = request.nextUrl.pathname.startsWith('/api');
  const isStatic = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/favicon') || request.nextUrl.pathname.endsWith('.png');

  if (isLoginPage || isApi || isStatic) return NextResponse.next();

  const auth = request.cookies.get('tesgrup-auth');
  if (!auth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|tesgrup-logo.png).*)'],
};
