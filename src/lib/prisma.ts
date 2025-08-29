import { PrismaClient } from '@prisma/client';

// Declara um 'cachedPrisma' no escopo global para persistir entre hot reloads
declare global {
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;

// Verifica se está em produção ou se o 'cachedPrisma' já existe
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
