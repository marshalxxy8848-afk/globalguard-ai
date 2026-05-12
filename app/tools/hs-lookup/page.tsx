'use client';

import { useState, useEffect } from 'react';
import { searchByKeywords, getLastUpdated, type HsCodeItem } from '@/lib/hs-codes';

interface CategoryItem extends HsCodeItem { category: string; }

export default function HsLookupPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CategoryItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [dataUpdated, setDataUpdated] = useState('');

  useEffect(() => { setDataUpdated(getLastUpdated()); }, []);

  function handleSearch() {
    const keywords = query.trim().split(/[\s,，、]+/).filter(Boolean);
    if (keywords.length === 0) return;
    const found = searchByKeywords(keywords);
    setResults(found);
    setSearched(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold gradient-text">HS 编码查询</h1>
          <p className="mt-2 text-sm text-white/40">输入产品名称，快速查询 HS 编码和关税税率</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入产品名称，如：无线蓝牙耳机、智能手表、宠物玩具..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60 placeholder-white/20 outline-none focus:border-cyan-500/30"
          />
          <button onClick={handleSearch}
            className="px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            查询
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/10">
                <p className="text-sm text-white/40">未找到匹配的 HS 编码，请尝试其他关键词</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/30">找到 {results.length} 个匹配结果</p>
                {results.slice(0, 20).map((item) => (
                  <div key={item.hs_code} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-mono font-bold text-cyan-300">{item.hs_code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30">{item.category}</span>
                    </div>
                    <p className="text-sm text-white/70">{item.description}</p>
                    <div className="mt-3 flex gap-4 text-xs text-white/40">
                      <span>材质: {item.material}</span>
                      <span>用途: {item.usage}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/30">美国关税</span>
                        <span className="ml-2 text-white/70 font-mono">{item.base_tariff_us}%</span>
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/30">欧盟关税</span>
                        <span className="ml-2 text-white/70 font-mono">{item.base_tariff_eu}%</span>
                      </div>
                    </div>
                    {item.conditions && (
                      <div className="mt-2 text-[10px] text-amber-400/70">
                        监管条件: {item.conditions}
                      </div>
                    )}
                    {item.tax_rebate != null && (
                      <div className="mt-1 text-[10px] text-green-400/70">
                        出口退税率: {item.tax_rebate}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data freshness */}
        <div className="mt-8 text-center text-[10px] text-white/20">
          数据来源：GlobalGuard HS 数据库 · 更新于 {dataUpdated}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors">
            ← 返回首页使用 AI 拍照识别
          </a>
        </div>
      </main>
    </div>
  );
}
