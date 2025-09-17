// app/api/pontos/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/lib/prisma' // Assumindo que o nome da importação é 'db' como nos outros arquivos

interface UserJwtPayload {
  sub: number
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('A chave secreta JWT (JWT_SECRET) não está configurada.')
  }
  return new TextEncoder().encode(secret)
}

async function getUserIdFromToken(): Promise<number | null> {
  const tokenCookie = (await cookies()).get('auth_token')
  if (!tokenCookie) return null

  try {
    const { payload } = await jwtVerify<UserJwtPayload>(
      tokenCookie.value,
      getJwtSecretKey()
    )
    return payload.sub
  } catch (err) {
    console.error('Falha ao verificar o token:', err)
    return null
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
  // 1) Verifica usuário via JWT
  const userId = await getUserIdFromToken()
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // 2) Lê query params start / end
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Datas de início e fim são obrigatórias' },
        { status: 400 }
      )
    }

    // 3) Busca no banco os registros diários no período
    const pontosDoPeriodo = await db.ponto.findMany({
      where: {
        colaborador_id: userId,
        data: {
          gte: new Date(start), // '2023-10-01' -> new Date('2023-10-01T00:00:00Z')
          lte: new Date(end),   // '2023-10-31' -> new Date('2023-10-31T00:00:00Z')
        },
      },
      orderBy: { data: 'asc' },
    })

    // 4) Formata o payload para o front, transformando cada dia em múltiplos registros
    const result = pontosDoPeriodo.flatMap((pontoDia) => {
      const registrosDoDia = [];
      const dataFormatada = pontoDia.data.toISOString().split('T')[0];

      if (pontoDia.entrada1) {
        registrosDoDia.push({
          id: `${pontoDia.id}-1`,
          data: dataFormatada,
          hora: formatarHora(pontoDia.entrada1),
          tipo: 'Entrada 1',
        });
      }
      if (pontoDia.saida1) {
        registrosDoDia.push({
          id: `${pontoDia.id}-2`,
          data: dataFormatada,
          hora: formatarHora(pontoDia.saida1),
          tipo: 'Saída 1',
        });
      }
      if (pontoDia.entrada2) {
        registrosDoDia.push({
          id: `${pontoDia.id}-3`,
          data: dataFormatada,
          hora: formatarHora(pontoDia.entrada2),
          tipo: 'Entrada 2',
        });
      }
      if (pontoDia.saida2) {
        registrosDoDia.push({
          id: `${pontoDia.id}-4`,
          data: dataFormatada,
          hora: formatarHora(pontoDia.saida2),
          tipo: 'Saída 2',
        });
      }
      return registrosDoDia;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar pontos:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar pontos' },
      { status: 500 }
    )
  }
}
