import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json({ message: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    // 1. Encontrar o usuário
    const user = await db.colaborador.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 }); // Unauthorized
    }

    // 2. Comparar a senha enviada com a senha hash no banco
    const isPasswordValid = await compare(senha, user.senha);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // 3. Gerar o JWT
    const token = sign(
      { 
        // Payload: informações que queremos no token
        sub: user.id, // 'sub' é o padrão para "subject" (o ID do usuário)
        email: user.email,
        role: user.tipo, // Nossa role ('COLABORADOR' ou 'RH')
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '7d', // O token expira em 7 dias
      }
    );

    // 4. Armazenar o token em um cookie HTTP-Only
    const cookieStore = await cookies(); 
    cookieStore.set({
        name: 'auth_token',
        value: token,
        httpOnly: true, // O cookie não pode ser acessado por JavaScript no cliente (mais seguro)
        secure: process.env.NODE_ENV === 'production', // Em produção, só enviar em HTTPS
        path: '/', // O cookie é válido para todo o site
        maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
    });

    return NextResponse.json({ message: 'Login bem-sucedido!' });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
