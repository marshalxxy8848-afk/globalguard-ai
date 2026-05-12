// Unified database access layer — uses Prisma when DATABASE_URL is set, falls back to file-based JSON storage
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
function ensureDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }

interface StoredUser { id: string; email: string; passwordHash: string; createdAt: string; }
interface StoredAudit { id: string; userId: string; productName: string; hsCode: string; riskLevel: string; report: string; createdAt: string; }

function readJson<T>(file: string): T[] {
  ensureDir();
  const p = path.join(DATA_DIR, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : [];
}
function writeJson<T>(file: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

// Try Prisma first, fallback to file storage
let usePrisma = false;
let prismaClient: any = null;

try {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    const { PrismaClient } = require('./generated/prisma/client');
    const { PrismaNeon } = require('@prisma/adapter-neon');
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    prismaClient = new PrismaClient({ adapter });
    usePrisma = true;
  }
} catch { /* fallback to file storage */ }

export const db = {
  // === User operations ===
  async findUserByEmail(email: string) {
    if (usePrisma) return prismaClient.user.findUnique({ where: { email } });
    return readJson<StoredUser>('users.json').find((u) => u.email === email) || null;
  },

  async findUserById(id: string) {
    if (usePrisma) return prismaClient.user.findUnique({ where: { id }, select: { id: true, email: true, createdAt: true } });
    const u = readJson<StoredUser>('users.json').find((u) => u.id === id);
    return u ? { id: u.id, email: u.email, createdAt: u.createdAt } : null;
  },

  async createUser(email: string, passwordHash: string) {
    if (usePrisma) return prismaClient.user.create({ data: { email, passwordHash } });
    const users = readJson<StoredUser>('users.json');
    if (users.some((u) => u.email === email)) throw new Error('Email already registered');
    const user: StoredUser = { id: crypto.randomUUID(), email, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeJson('users.json', users);
    return user;
  },

  // === Audit operations ===
  async findAuditsByUserId(userId: string, take = 50) {
    if (usePrisma) return prismaClient.auditRecord.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take,
      select: { id: true, productName: true, hsCode: true, riskLevel: true, report: true, createdAt: true },
    });
    return readJson<StoredAudit>('audits.json')
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, take)
      .map(({ userId: _u, ...r }) => r);
  },

  async createAuditRecord(data: { userId: string; productName: string; hsCode: string; riskLevel: string; report: string }) {
    if (usePrisma) return prismaClient.auditRecord.create({ data });
    const audits = readJson<StoredAudit>('audits.json');
    const record: StoredAudit = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    audits.push(record);
    writeJson('audits.json', audits);
    return record;
  },
};
