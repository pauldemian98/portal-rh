// app/api/ponto/visualizar/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

interface UserJwtPayload {
  sub: number;
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('A chave secreta JWT (JWT_SECRET) não está configurada.');
  }
  return new TextEncoder().encode(secret);
}

async function getUserIdFromToken(): Promise<number | null> {
    const tokenCookie = (await cookies()).get('auth_token');
    if (!tokenCookie) return null;

    try {
        const { payload } = await jwtVerify<UserJwtPayload>(tokenCookie.value, getJwtSecretKey());
        return payload.sub;
    } catch (error) {
        console.error("Falha ao verificar o token:", error);
        return null;
    }
}

// Função auxiliar para formatar a hora, SEM converter fuso horário
function formatarHora(dataHora: Date | null): string {
    if (!dataHora) return '';

    // Formata a hora usando o fuso horário UTC para evitar conversões automáticas.
    // Isso garante que a hora exibida seja exatamente a que está no objeto Date,
    // que, conforme nossa API de registro, está em UTC.
    return dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC', // Ponto-chave: força a formatação em UTC
    });
}


export async function GET(request: NextRequest) {
    const userId = await getUserIdFromToken();

    if (!userId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        // Define o início e o fim do dia atual em UTC para a consulta
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const pontoDoDia = await db.ponto.findFirst({
            where: {
                colaborador_id: userId,
                data: today,
            },
        });

        // Se não houver registro para o dia, retorna uma lista vazia
        if (!pontoDoDia) {
            return NextResponse.json([]);
        }

        const registrosFormatados = [];
        const dataFormatada = pontoDoDia.data.toISOString().split('T')[0];

        // Adiciona cada registro de ponto existente à lista formatada
        if (pontoDoDia.entrada1) {
            registrosFormatados.push({
                id: pontoDoDia.id + '-1', // ID único para a chave do React
                data: dataFormatada,
                hora: formatarHora(pontoDoDia.entrada1),
                tipo: 'Entrada 1',
            });
        }
        if (pontoDoDia.saida1) {
            registrosFormatados.push({
                id: pontoDoDia.id + '-2',
                data: dataFormatada,
                hora: formatarHora(pontoDoDia.saida1),
                tipo: 'Saída 1',
            });
        }
        if (pontoDoDia.entrada2) {
            registrosFormatados.push({
                id: pontoDoDia.id + '-3',
                data: dataFormatada,
                hora: formatarHora(pontoDoDia.entrada2),
                tipo: 'Entrada 2',
            });
        }
        if (pontoDoDia.saida2) {
            registrosFormatados.push({
                id: pontoDoDia.id + '-4',
                data: dataFormatada,
                hora: formatarHora(pontoDoDia.saida2),
                tipo: 'Saída 2',
            });
        }

        console.log(registrosFormatados)
        return NextResponse.json(registrosFormatados);
    } catch (error) {
        console.error("Erro ao buscar os pontos de hoje:", error);
        return NextResponse.json({ error: "Falha ao buscar os pontos" }, { status: 500 });
    }
}
