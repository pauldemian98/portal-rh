import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // 'jose' é uma lib mais moderna e segura para JWT no Edge

interface UserJwtPayload {
  sub: number;
  role: string;
  iat: number;
  exp: number;
}

// Retorna a chave secreta como um Uint8Array
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT Secret key is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('auth_token');

  // Tenta obter o payload do token
  let userPayload: UserJwtPayload | null = null;
  if (tokenCookie) {
    try {
      const { payload } = await jwtVerify<UserJwtPayload>(
        tokenCookie.value,
        getJwtSecretKey()
      );
      userPayload = payload;
    } catch (error) {
      // Token inválido (expirado, malformado, etc.)
      console.log('Token verification failed:', error);
      // Se o token falhar, vamos redirecionar para o login, limpando o cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }
  
  // Se não há token/payload e a rota é protegida, redireciona para o login
  if (!userPayload && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
  }

  // Lógica de Controle de Acesso Baseada em Role (RBAC)
  if (userPayload) {
    // Regra: Apenas usuários 'RH' podem acessar rotas que começam com '/dashboard/rh'
    if (pathname.startsWith('/dashboard/rh') && userPayload.role !== 'RH') {
      // Se um não-RH tentar acessar a área de RH, redireciona para seu próprio dashboard
      return NextResponse.redirect(new URL('/dashboard/colaborador', request.url));
    }
  }

  // Se passou por todas as verificações, permite que a requisição continue
  return NextResponse.next();
}

// O 'matcher' define em quais rotas o middleware será executado.
// Isso evita que ele rode em rotas de API, assets (_next/static), etc.
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
