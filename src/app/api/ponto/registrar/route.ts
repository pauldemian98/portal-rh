import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

interface UserJwtPayload {
  sub: number
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurada.')
  return new TextEncoder().encode(secret)
}

async function getUserIdFromToken(): Promise<number | null> {
  const tokenCookie = (await cookies()).get('auth_token')
  if (!tokenCookie) return null
  try {
    const { payload } = await jwtVerify<UserJwtPayload>(
      tokenCookie.value,
      getJwtSecretKey(),
    )
    return payload.sub
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromToken()
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const clientTimestamp = body.timestamp // Ex: "2024-09-17T09:00:00.000"

    // --- AJUSTE CRÍTICO DE FUSO HORÁRIO ---
    // Adicionamos 'Z' para tratar a string como UTC. Isso garante que "09:00" enviado
    // pelo cliente seja tratado como "09:00" no servidor, sem conversões de fuso.
    const dataHoraRegistro = new Date(clientTimestamp + 'Z');

    // Para a busca no banco, usamos a mesma data base, pegando apenas o dia.
    // Criamos uma nova data em UTC para garantir que a busca seja pelo dia correto.
    const dataParaBusca = new Date(
      Date.UTC(
        dataHoraRegistro.getUTCFullYear(),
        dataHoraRegistro.getUTCMonth(),
        dataHoraRegistro.getUTCDate(),
      ),
    )

    // Procura um registro de ponto existente para o colaborador na data atual
    const pontoDoDia = await db.ponto.findFirst({
      where: {
        colaborador_id: userId,
        data: dataParaBusca,
      },
    })

    if (pontoDoDia) {
      // Se um registro já existe, atualiza o próximo campo de horário disponível
      // Passando o objeto 'dataHoraRegistro' completo. O Prisma irá extrair apenas a HORA.
      let campoParaAtualizar = {}
      if (!pontoDoDia.saida1) {
        campoParaAtualizar = { saida1: dataHoraRegistro }
      } else if (!pontoDoDia.entrada2) {
        campoParaAtualizar = { entrada2: dataHoraRegistro }
      } else if (!pontoDoDia.saida2) {
        campoParaAtualizar = { saida2: dataHoraRegistro }
      } else {
        return NextResponse.json(
          { message: 'Todos os registros de ponto para hoje já foram feitos.' },
          { status: 400 },
        )
      }

      const pontoAtualizado = await db.ponto.update({
        where: { id: pontoDoDia.id },
        data: campoParaAtualizar,
      })

      return NextResponse.json(pontoAtualizado, { status: 200 })
    } else {
      // Se não existe registro para o dia, cria um novo
      const novoPonto = await db.ponto.create({
        data: {
          colaborador_id: userId,
          data: dataParaBusca,        // O Prisma vai gravar a DATA
          entrada1: dataHoraRegistro, // O Prisma vai gravar a HORA
        },
      })
      return NextResponse.json(novoPonto, { status: 201 })
    }
  } catch (error) {
    console.error('Erro ao registrar ponto:', error)
    return NextResponse.json(
      { error: 'Falha ao registrar o ponto' },
      { status: 500 },
    )
  }
}
