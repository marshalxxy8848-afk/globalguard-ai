import hsCodes from '@/hs_codes.json';
import { searchHsCodeExternal, type ExternalHsResult } from './search-agent';

export interface HsCodeItem {
  hs_code: string;
  description: string;
  material: string;
  usage: string;
  base_tariff_us: number;
  base_tariff_eu: number;
  vat_eu: number;
  restricted: boolean;
  section_301_tariff: number;
  conditions?: string;    // 监管条件代码 (e.g. "4AB"), empty = none
  tax_rebate?: number;    // 出口退税率百分比 (e.g. 13), null = none
}

export function getLastUpdated(): string {
  return (hsCodes as any).metadata?.last_updated || 'unknown';
}

export function getConditionLabel(code: string): string {
  const labels: Record<string, string> = {
    '1': '进口许可证',
    '4': '出口许可证',
    'A': '进口检验检疫',
    'B': '出口检验检疫',
    'O': '自动进口许可证',
    'Y': '原产地证明',
    'P': '固体废物进口',
    's': '适用ITA税率',
    'x': '加工贸易禁止',
  };
  return labels[code] || code;
}

export interface CategoryItem extends HsCodeItem {
  category: string;
}

let _allItems: CategoryItem[] | null = null;
let _itemsByCode: Map<string, CategoryItem> | null = null;

function buildCache() {
  if (_allItems) return;
  _allItems = [];
  _itemsByCode = new Map();
  for (const [cat, data] of Object.entries(hsCodes.categories)) {
    for (const item of data.items) {
      const tagged = { ...item, category: cat };
      _allItems.push(tagged);
      _itemsByCode.set(tagged.hs_code, tagged);
    }
  }
}

export function getAllItems(): CategoryItem[] {
  buildCache();
  return _allItems!;
}

export function findByHsCode(code: string): CategoryItem | undefined {
  buildCache();
  return _itemsByCode!.get(code);
}

const MAX_KEYWORD_ITEMS = 100;

export function searchByKeywords(keywords: string[]): CategoryItem[] {
  const all = getAllItems();
  const query = keywords.map((k) => k.toLowerCase());
  return all
    .map((item) => {
      const text = [item.description, item.material, item.usage, item.category]
        .join(' ')
        .toLowerCase();
      const score = query.filter((q) => text.includes(q)).length;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_KEYWORD_ITEMS)
    .map(({ item }) => item);
}

// --- External fallback with MCP-style search agent ---

export interface SearchResult {
  local: CategoryItem[];
  external: ExternalHsResult[];
  usedFallback: boolean;
  source: string;
}

export async function searchWithFallback(
  productName: string,
  material: string,
  usage: string,
  suggestedCodes: string[],
): Promise<SearchResult> {
  const keywords = [productName, material, usage, ...suggestedCodes];
  const local = searchByKeywords(keywords);

  // Check if we have a solid local match (2+ hits or any exact code match)
  const exactMatch = suggestedCodes.some((code) => findByHsCode(code));
  const hasGoodLocal = local.length >= 2 || exactMatch;

  if (hasGoodLocal) {
    return { local, external: [], usedFallback: false, source: 'local' };
  }

  // Trigger external search agent — this calls USITC API → web fallback → mock
  const external = await searchHsCodeExternal(productName, material, usage);
  return {
    local,
    external: external.results,
    usedFallback: true,
    source: external.source,
  };
}
