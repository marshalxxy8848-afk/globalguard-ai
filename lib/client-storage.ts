const STORAGE_KEY = 'globalguard_audits';

export interface StoredAudit {
  id: string;
  productName: string;
  hsCode: string;
  riskLevel: string;
  material: string;
  usage: string;
  report: unknown;
  createdAt: string;
  suggestedHsCodes?: { code: string; reason: string; confidence: number }[];
}

export function loadAudits(): StoredAudit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveAudit(audit: StoredAudit): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadAudits();
    const idx = list.findIndex((a) => a.id === audit.id);
    if (idx >= 0) list[idx] = audit;
    else list.unshift(audit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota exceeded or other error — silently fail
  }
}

export function deleteAudit(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadAudits().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function clearAudits(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
