// File-based fallback audit storage when PostgreSQL is unavailable

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredAudit {
  id: string;
  userId: string;
  productName: string;
  hsCode: string;
  riskLevel: string;
  report: string;
  createdAt: string;
}

function readJson<T>(file: string): T[] {
  ensureDir();
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeJson<T>(file: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

// === User operations ===

export function findUserByEmail(email: string): StoredUser | undefined {
  return readJson<StoredUser>('users.json').find((u) => u.email === email);
}

export function findUserById(id: string): StoredUser | undefined {
  return readJson<StoredUser>('users.json').find((u) => u.id === id);
}

export function createUser(email: string, passwordHash: string): StoredUser {
  const users = readJson<StoredUser>('users.json');
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJson('users.json', users);
  return user;
}

// === Audit operations ===

export function findAuditsByUserId(userId: string, take = 50): StoredAudit[] {
  return readJson<StoredAudit>('audits.json')
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, take);
}

export function createAuditRecord(data: {
  userId: string;
  productName: string;
  hsCode: string;
  riskLevel: string;
  report: string;
}): StoredAudit {
  const audits = readJson<StoredAudit>('audits.json');
  const record: StoredAudit = {
    id: crypto.randomUUID(),
    userId: data.userId,
    productName: data.productName,
    hsCode: data.hsCode,
    riskLevel: data.riskLevel,
    report: data.report,
    createdAt: new Date().toISOString(),
  };
  audits.push(record);
  writeJson('audits.json', audits);
  return record;
}
