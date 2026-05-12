/**
 * Real-time Search Agent — external HS code lookup via USITC API
 * and web fallback. Acts as the MCP-style connector for customs data.
 */

export interface ExternalHsResult {
  code: string;
  description: string;
  source: 'usitc' | 'web' | 'mock';
  confidence: number;
  chapter?: string;
  notes?: string;
}

interface SearchAgentResult {
  results: ExternalHsResult[];
  source: string;
  cached: boolean;
}

// --- USITC HTS API client ---

const USITC_BASE = 'https://hts.usitc.gov/rest';

interface UsitcSearchHit {
  chapter?: string;
  heading?: string;
  subheading?: string;
  statistical?: string;
  description?: string;
  score?: number;
}

async function searchUsitc(query: string): Promise<ExternalHsResult[]> {
  try {
    const res = await fetch(
      `${USITC_BASE}/search/${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`USITC returned ${res.status}`);
    const data = (await res.json()) as { hits?: { hits?: Array<{ _source?: UsitcSearchHit; _score?: number }> } };
    const hits = data?.hits?.hits;
    if (!hits?.length) return [];

    return hits.slice(0, 5).map((hit) => {
      const s = hit._source;
      const parts = [s?.heading, s?.subheading, s?.statistical].filter(Boolean);
      // Build a 6-digit HS code from heading + subheading
      const raw = `${s?.heading || ''}${s?.subheading || ''}`.replace(/\D/g, '');
      const code = raw.length >= 6 ? raw.slice(0, 6) : raw.padEnd(6, '0');
      return {
        code,
        description: s?.description || query,
        source: 'usitc' as const,
        confidence: Math.min((hit._score || 1) / 10, 0.95),
        chapter: s?.chapter,
      };
    });
  } catch (err) {
    console.warn('[search-agent] USITC API error:', err instanceof Error ? err.message : err);
    return [];
  }
}

// --- Web search fallback (server-side HTTP) ---

async function searchWeb(query: string): Promise<ExternalHsResult[]> {
  const terms = encodeURIComponent(query.slice(0, 80));
  const urls = [
    `https://trade.ec.europa.eu/access-to-markets/en/search?product=${terms}`,
    `https://hts.usitc.gov/search?q=${terms}`,
  ];
  const results: ExternalHsResult[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'GlobalGuardAI/1.0' },
      });
      const text = await res.text();
      // Crude HS code extraction from HTML — look for 6-digit patterns
      const codeMatches = text.match(/\b(\d{4}\.\d{2})\b/g);
      if (codeMatches) {
        for (const match of codeMatches.slice(0, 3)) {
          results.push({
            code: match.replace('.', ''),
            description: `Possible HS match from ${url}`,
            source: 'web',
            confidence: 0.4,
          });
        }
      }
    } catch {
      // silently fail — this is a best-effort fallback
    }
  }
  return results;
}

// --- Public API ---

let _cache = new Map<string, { ts: number; data: SearchAgentResult }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export async function searchHsCodeExternal(
  productName: string,
  material: string,
  usage: string,
): Promise<SearchAgentResult> {
  const query = [productName, material, usage].filter(Boolean).join(' ');
  const cacheKey = query.toLowerCase().slice(0, 120);

  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { ...cached.data, cached: true };
  }

  // Stage 1: USITC API
  let results = await searchUsitc(query);
  let source = 'usitc';

  // Stage 2: if USITC returned nothing, try web scrape fallback
  if (!results.length) {
    results = await searchWeb(query);
    source = 'web';
  }

  // Stage 3: last resort — mock fallback for dev/demo
  if (!results.length && !process.env.AI_API_KEY) {
    results = [
      { code: '847130', description: 'Automatic data processing machine (likely classification)', source: 'mock', confidence: 0.35 },
      { code: '854231', description: 'Electronic integrated circuit (if primarily electronic)', source: 'mock', confidence: 0.25 },
    ];
    source = 'mock';
  }

  const result: SearchAgentResult = { results, source, cached: false };
  _cache.set(cacheKey, { ts: Date.now(), data: result });
  return result;
}

// Exposed for testing
export function clearSearchCache() {
  _cache.clear();
}
