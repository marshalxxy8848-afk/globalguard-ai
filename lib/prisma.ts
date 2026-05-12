// Backward-compatible Prisma client — use db from @/lib/db instead for new code
// This file exists only to provide a non-crashing import for any legacy references.

import type { PrismaClient as PrismaClientType } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

function createClient(): PrismaClientType | null {
  try {
    const { PrismaClient } = require('./generated/prisma/client');
    if (process.env.DATABASE_URL?.startsWith('postgres')) {
      const { PrismaNeon } = require('@prisma/adapter-neon');
      const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
      return new PrismaClient({ adapter }) as PrismaClientType;
    }
    // SQLite mode — Prisma v7 requires adapter arg, so wrap any init error
    try {
      return new PrismaClient() as PrismaClientType;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export const prisma: PrismaClientType | null = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
