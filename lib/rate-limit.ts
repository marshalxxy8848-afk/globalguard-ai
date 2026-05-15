import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const ANON_FILE = path.join(DATA_DIR, 'anon-usage.json');
const DAILY_LIMIT_ANON = 5;
const DAILY_LIMIT_USER = 20;

interface UsageRecord {
  [key: string]: { date: string; count: number };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsage(): UsageRecord {
  ensureDir();
  try {
    if (fs.existsSync(ANON_FILE)) return JSON.parse(fs.readFileSync(ANON_FILE, 'utf-8'));
  } catch {}
  return {};
}

function writeUsage(data: UsageRecord) {
  ensureDir();
  fs.writeFileSync(ANON_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check if a request is within rate limit. Returns { allowed, remaining, limit } */
export function checkRateLimit(ip: string, userId?: string): { allowed: boolean; remaining: number; limit: number } {
  const key = userId || `ip:${ip}`;
  const limit = userId ? DAILY_LIMIT_USER : DAILY_LIMIT_ANON;
  const usage = readUsage();
  const todayStr = today();

  const record = usage[key];
  if (!record || record.date !== todayStr) {
    // First use today
    usage[key] = { date: todayStr, count: 1 };
    writeUsage(usage);
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  record.count += 1;
  writeUsage(usage);
  return { allowed: true, remaining: limit - record.count, limit };
}

/** Get remaining quota for display */
export function getRemainingQuota(ip: string, userId?: string): { used: number; remaining: number; limit: number } {
  const key = userId || `ip:${ip}`;
  const limit = userId ? DAILY_LIMIT_USER : DAILY_LIMIT_ANON;
  const usage = readUsage();
  const record = usage[key];
  const todayStr = today();

  if (!record || record.date !== todayStr) {
    return { used: 0, remaining: limit, limit };
  }
  return { used: record.count, remaining: Math.max(0, limit - record.count), limit };
}
