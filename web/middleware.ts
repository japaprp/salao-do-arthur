import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/auth/login', '/auth/register', '/'];

  // Verificar se a rota atual é pública
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/api/')
  );

  // Se for uma rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar se há um token de autenticação
  const token = request.cookies.get('auth_token')?.value;

  // Se não há token e não é uma rota pública, redirecionar para login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Se há token, permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};