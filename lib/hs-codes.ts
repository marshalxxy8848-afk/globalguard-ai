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
