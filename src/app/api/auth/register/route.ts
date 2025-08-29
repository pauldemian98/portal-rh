import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/prisma';
import { TipoColaborador } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, senha, nome, cargo, data_admissao, tipo } = await request.json();

    // Validação básica
    if (!email || !senha || !nome || !cargo || !data_admissao || !tipo) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }
    
    // Verifica se o tipo é válido
    if (!Object.values(TipoColaborador).includes(tipo)) {
        return NextResponse.json({ message: 'Tipo de colaborador inválido.' }, { status: 400 });
    }

    // Verifica se o e-mail já existe
    const existingUser = await db.colaborador.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 }); // 409 Conflict
    }

    // Criptografa a senha
    const hashedPassword = await hash(senha, 10);

    // Cria o novo colaborador
    const novoColaborador = await db.colaborador.create({
      data: {
        email,
        senha: hashedPassword,
        nome,
        cargo,
        data_admissao: new Date(data_admissao),
        tipo, // Será 'COLABORADOR' ou 'RH'
      },
    });

    // Retorna uma resposta de sucesso sem a senha
    const { senha: _, ...userWithoutPassword } = novoColaborador;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
