import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Usamos GET pois é uma ação simples de "solicitar logout"
export async function GET() {
  try {
    // Remove o cookie de autenticação
    cookies().delete('auth_token');

    // Cria uma resposta de redirecionamento para a página de login
    const response = NextResponse.redirect(new URL('/login', 'http://localhost:3000'), {
      status: 307, // Temporary Redirect
    });
    
    return response;

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
