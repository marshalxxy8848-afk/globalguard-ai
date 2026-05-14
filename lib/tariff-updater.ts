// Real-time tariff data update mechanism
// Supports: manual refresh via API, cache overrides, data freshness tracking
// Integrates with the static tariff engine via a cache overlay

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const CACHE_FILE = path.join(DATA_DIR, 'tariff-cache.json');
const META_FILE = path.join(DATA_DIR, 'tariff-meta.json');

export interface TariffMeta {
  lastUpdated: string | null;
  lastChecked: string | null;
  nextScheduledCheck: string | null;
  source: string;
  status: 'up-to-date' | 'stale' | 'error' | 'never';
  staticEntriesCount: number;
  cachedOverridesCount: number;
  version: string;
}

export interface TariffOverride {
  code6: string;
  usRate?: number;
  euRate?: number;
  section301?: number;
  source: string;
  updatedAt: string;
  notes?: string;
}

interface CacheData {
  overrides: TariffOverride[];
  /** Rates that were fetched from external sources (non-static) */
  fetched: { code6: string; usRate: number; euRate: number; section301: number; source: string }[];
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch { /* ignore */ }
  return fallback;
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// === Configured external data sources ===

interface DataSource {
  name: string;
  country: 'us' | 'eu';
  url: string;
  refreshIntervalMs: number;
  enabled: boolean;
}

const DATA_SOURCES: DataSource[] = [
  {
    name: 'USITC HTS API',
    country: 'us',
    url: 'https://hts.usitc.gov/api/search',
    refreshIntervalMs: 6 * 60 * 60 * 1000, // 每6小时
    enabled: true,
  },
  {
    name: 'EU TARIC (zolltarifnummern.de)',
    country: 'eu',
    url: 'https://api.zolltarifnummern.de/api/v2/classification',
    refreshIntervalMs: 6 * 60 * 60 * 1000,
    enabled: true,
  },
  {
    name: 'Exchange Rate API',
    country: 'us',
    url: 'https://api.exchangerate.host/latest?base=USD',
    refreshIntervalMs: 24 * 60 * 60 * 1000, // 每日
    enabled: true,
  },
];

// === Public API ===

const STATIC_ENTRIES_COUNT = (() => {
  try {
    const data = require('./hs-tariff-data');
    return data.HS_TARIFF_COUNT || 0;
  } catch {
    return 0;
  }
})();

/** Get current tariff data status */
export function getTariffStatus(): TariffMeta {
  const meta = readJson<Partial<TariffMeta>>(META_FILE, {});
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  return {
    lastUpdated: meta.lastUpdated || null,
    lastChecked: meta.lastChecked || null,
    nextScheduledCheck: meta.nextScheduledCheck || null,
    source: meta.source || 'static',
    status: meta.status || 'never',
    staticEntriesCount: STATIC_ENTRIES_COUNT,
    cachedOverridesCount: cache.overrides.length + cache.fetched.length,
    version: meta.version || '1.0.0',
  };
}

/** Get all cached overrides */
export function getTariffOverrides(): TariffOverride[] {
  return readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] }).overrides;
}

/** Get fetched external rates */
export function getFetchedRates() {
  return readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] }).fetched;
}

/** Override a specific HS6 code's rates */
export function setTariffOverride(override: Omit<TariffOverride, 'updatedAt'>): TariffOverride {
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  const existing = cache.overrides.findIndex((o) => o.code6 === override.code6);
  const entry: TariffOverride = { ...override, updatedAt: new Date().toISOString() };
  if (existing >= 0) cache.overrides[existing] = entry;
  else cache.overrides.push(entry);
  writeJson(CACHE_FILE, cache);
  return entry;
}

/** Remove an override for a specific HS6 code */
export function removeTariffOverride(code6: string): boolean {
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  const len = cache.overrides.length;
  cache.overrides = cache.overrides.filter((o) => o.code6 !== code6);
  if (cache.overrides.length === len) return false;
  writeJson(CACHE_FILE, cache);
  return true;
}

/** Check for applicable overrides when resolving a 6-digit HS code */
export function findOverride(code6: string): TariffOverride | undefined {
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  return cache.overrides.find((o) => o.code6 === code6);
}

/** Find externally fetched rate (non-override) */
export function findFetchedRate(code6: string) {
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  return cache.fetched.find((f) => f.code6 === code6);
}

// === API Fetchers ===

/** Fetch EU tariff rate from zolltarifnummern.de (free, no key needed) */
async function fetchEuTariff(hsCode: string): Promise<{ rate: number; notes?: string } | null> {
  try {
    // Try V2 API for classification (returns duty rates for EU)
    const url = `https://api.zolltarifnummern.de/api/v2/classification/${hsCode}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    // The API returns customs duty rate information
    if (data?.tarif?.dritter_satz) {
      const rateStr = data.tarif.dritter_satz.replace('%', '').replace(',', '.');
      const rate = parseFloat(rateStr) / 100;
      if (!isNaN(rate)) return { rate, notes: data.tarif.warenbenennung || '' };
    }
    return null;
  } catch {
    return null;
  }
}

/** Fetch exchange rate for CNY from free API */
async function fetchExchangeRates(): Promise<{ cny: number; eur: number } | null> {
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=CNY,EUR', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.rates) {
      return { cny: data.rates.CNY || 7.2, eur: data.rates.EUR || 0.92 };
    }
    return null;
  } catch {
    return null;
  }
}

/** Search USITC for an HS code's tariff rate */
async function fetchUsTariff(hsCode: string): Promise<{ rate: number; section301?: number } | null> {
  try {
    const clean = hsCode.replace(/\D/g, '').slice(0, 6);
    // USITC search API — free and public
    const url = `https://hts.usitc.gov/rest/search/${clean}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    // Parse the response for general duty rate
    if (data?.hits?.hits?.[0]?._source) {
      const src = data.hits.hits[0]._source;
      const rateGeneral = src.rate_general || 0;
      const rateSpecial = src.rate_special || 0;
      return { rate: rateGeneral, section301: rateSpecial };
    }
    return null;
  } catch {
    return null;
  }
}

/** Try to fetch China customs tariff rate (scrapes singlewindow.cn public data) */
async function fetchChinaTariff(hsCode: string): Promise<{ mfnRate: number; rebateRate?: number } | null> {
  try {
    const clean = hsCode.replace(/\D/g, '').slice(0, 6);
    // Use public China customs HS code query interface
    const url = `https://www.singlewindow.cn/api/hs/search?hsCode=${clean}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.data) {
      const mfnRate = parseFloat(String(data.data.mfnRate || 0)) / 100;
      const rebateRate = data.data.rebateRate ? parseFloat(String(data.data.rebateRate)) : undefined;
      return { mfnRate: isNaN(mfnRate) ? 0 : mfnRate, rebateRate };
    }
    return null;
  } catch {
    return null;
  }
}

/** Save fetched rate into the cache */
function saveFetchedRate(code6: string, rates: { usRate: number; euRate: number; section301: number }, source: string) {
  const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
  const existing = cache.fetched.findIndex((f) => f.code6 === code6);
  const entry = { code6, ...rates, source };
  if (existing >= 0) cache.fetched[existing] = entry;
  else cache.fetched.push(entry);
  writeJson(CACHE_FILE, cache);
}

/** List of high-traffic HS6 codes to keep fresh */
const PRIORITY_HS_CODES = [
  '851830', '851762', '847130', '620462', '640399', '950300',
  '420222', '611020', '852871', '841451', '392690', '732393',
  '940360', '711719', '910111', '330499', '848180', '854442',
  '621210', '950691', '640419', '620520', '851712', '950450',
];

/**
 * Refresh tariff data from external sources.
 * Fetches real rates from free public APIs for the most common HS codes.
 */
export async function refreshTariffData(): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
  source: string;
}> {
  const errors: string[] = [];
  let updated = 0;

  // 1. Fetch exchange rates
  try {
    const fx = await fetchExchangeRates();
    if (fx) {
      console.log(`[tariff-updater] Exchange rates: USD/CNY=${fx.cny}, USD/EUR=${fx.eur}`);
      updated++;
    }
  } catch (err) {
    errors.push(`Exchange rate: ${err instanceof Error ? err.message : 'failed'}`);
  }

  // 2. Fetch tariff rates for priority HS codes
  let euFetched = 0;
  let usFetched = 0;

  for (const code6 of PRIORITY_HS_CODES) {
    try {
      // Fetch EU rate
      const euRate = await fetchEuTariff(code6);
      if (euRate !== null) {
        const cleanCode = code6.padEnd(6, '0');
        saveFetchedRate(cleanCode, {
          usRate: -1, // filled below
          euRate: euRate.rate,
          section301: -1,
        }, `zolltarifnummern.de (${new Date().toISOString().slice(0, 10)})`);
        euFetched++;
        updated++;
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      }

      // Fetch US rate
      const usRate = await fetchUsTariff(code6);
      if (usRate !== null) {
        const cleanCode = code6.padEnd(6, '0');
        saveFetchedRate(cleanCode, {
          usRate: usRate.rate,
          euRate: -1,
          section301: usRate.section301 ?? -1,
        }, `USITC (${new Date().toISOString().slice(0, 10)})`);
        usFetched++;
        updated++;
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      // individual code failure is OK
    }
  }

  console.log(`[tariff-updater] Fetched ${euFetched} EU rates, ${usFetched} US rates`);

  // 3. Update meta
  const meta = readJson<Partial<TariffMeta>>(META_FILE, {});
  const now = new Date().toISOString();
  const nextCheck = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  writeJson(META_FILE, {
    ...meta,
    lastChecked: now,
    lastUpdated: meta.lastUpdated || now,
    nextScheduledCheck: nextCheck,
    status: updated > 0 ? 'up-to-date' : 'stale',
    source: updated > 0 ? 'external+static' : 'static',
    version: meta.version || '1.0.0',
  });

  return {
    success: updated > 0,
    updated: euFetched + usFetched,
    errors,
    source: updated > 0 ? 'external' : 'static',
  };
}

/**
 * Look up effective rate — checks overrides first, then fetched data.
 */
export function getEffectiveRate(
  code6: string,
): { usRate: number; euRate: number; section301: number } | null {
  const override = findOverride(code6);
  if (override) {
    return {
      usRate: override.usRate ?? -1,
      euRate: override.euRate ?? -1,
      section301: override.section301 ?? -1,
    };
  }
  const fetched = findFetchedRate(code6);
  if (fetched) {
    return { usRate: fetched.usRate, euRate: fetched.euRate, section301: fetched.section301 };
  }
  return null;
}

/** Load all cached overrides into the tariff engine's runtime cache */
export function loadCacheIntoEngine(): number {
  try {
    const { setTariffOverride } = require('./tariff-engine');
    const cache = readJson<CacheData>(CACHE_FILE, { overrides: [], fetched: [] });
    let count = 0;
    for (const o of cache.overrides) {
      const r = getEffectiveRate(o.code6);
      if (r && r.usRate >= 0) {
        setTariffOverride(o.code6, { usRate: r.usRate, euRate: r.euRate ?? -1, section301: r.section301 ?? -1 });
        count++;
      }
    }
    for (const f of cache.fetched) {
      setTariffOverride(f.code6, { usRate: f.usRate, euRate: f.euRate, section301: f.section301 });
      count++;
    }
    return count;
  } catch { return 0; }
}
