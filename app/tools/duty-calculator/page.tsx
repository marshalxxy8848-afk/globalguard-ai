'use client';

import { useState, useEffect } from 'react';
import { findByHsCode, getLastUpdated } from '@/lib/hs-codes';
import { getEuVatRate, EU_VAT_RATES } from '@/lib/eu-vat';

const US_FLAT_RATE = 25;
const US_AD_VALOREM = 0.30;
const SHIPPING_EST: Record<string, number> = { china: 8, vietnam: 10, thailand: 12, mexico: 15 };

export default function DutyCalculatorPage() {
  const [hsCode, setHsCode] = useState('');
  const [value, setValue] = useState(50);
  const [origin, setOrigin] = useState('china');
  const [euCountry, setEuCountry] = useState('');
  const [result, setResult] = useState<null | { us: number; eu: number; total: number; description: string; section301: number }>(null);
  const [error, setError] = useState('');
  const [dataUpdated, setDataUpdated] = useState('');

  useEffect(() => { setDataUpdated(getLastUpdated()); }, []);

  function calculate() {
    setError('');
    const code = hsCode.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) { setError('请输入 6 位 HS 编码'); return; }
    const item = findByHsCode(code);

    const sec301 = item?.section_301_tariff ?? 0;
    const isChina = origin === 'china';
    const usAdValorem = value * US_AD_VALOREM;
    const usFlat = US_FLAT_RATE;
    const usBase = Math.max(usAdValorem, usFlat);
    const usDuty = Math.round((usBase + (isChina ? value * sec301 : 0)) * 100) / 100;

    const euRate = item ? item.base_tariff_eu / 100 : 0.05;
    const euVatRate = getEuVatRate(euCountry);
    const euDuty = Math.round(value * euRate * 100) / 100;
    const euVat = Math.round((value + euDuty) * euVatRate * 100) / 100;

    const shipping = SHIPPING_EST[origin] ?? 10;

    setResult({
      us: usDuty,
      eu: euDuty + euVat,
      total: Math.round((value + shipping + usDuty + euDuty + euVat) * 100) / 100,
      description: item?.description || '通用商品类别',
      section301: isChina ? Math.round(value * sec301 * 100) / 100 : 0,
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold gradient-text">进口关税计算器</h1>
          <p className="mt-2 text-sm text-white/40">输入 HS 编码和货值，计算中美欧进口关税</p>
        </div>

        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
          <div>
            <label className="text-xs text-white/30 block mb-1">HS 编码（6 位）</label>
            <input value={hsCode} onChange={(e) => setHsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="例如：851830"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white/60 placeholder-white/20 outline-none focus:border-cyan-500/30 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-white/30 block mb-1">申报货值 (USD)</label>
            <input type="number" min={1} value={value} onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white/60 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="text-xs text-white/30 block mb-1">原产国</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0d0d14] border border-white/10 text-sm text-white/60 outline-none focus:border-cyan-500/30"
            >
              <option value="china">中国</option>
              <option value="vietnam">越南</option>
              <option value="thailand">泰国</option>
              <option value="mexico">墨西哥</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/30 block mb-1">欧盟目的国（可选）</label>
            <select value={euCountry} onChange={(e) => setEuCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0d0d14] border border-white/10 text-sm text-white/60 outline-none focus:border-cyan-500/30"
            >
              <option value="">不指定（默认 20% VAT）</option>
              {Object.entries(EU_VAT_RATES).map(([code, { name, rate }]) => (
                <option key={code} value={code}>{name} ({(rate * 100).toFixed(1)}%)</option>
              ))}
            </select>
          </div>

          <button onClick={calculate}
            className="w-full py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            计算关税
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">计算结果</h2>
              <p className="text-xs text-white/40 mb-3">{result.description}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-white/30">美国关税</p>
                  <p className="text-lg font-bold text-white/80 font-mono">${result.us.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-white/30">欧盟关税+VAT</p>
                  <p className="text-lg font-bold text-white/80 font-mono">€{result.eu.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                  <p className="text-xs text-cyan-300/60">到门总成本</p>
                  <p className="text-lg font-bold text-cyan-300 font-mono">${result.total.toFixed(2)}</p>
                </div>
              </div>
              {result.section301 > 0 && (
                <div className="mt-3 p-2 rounded bg-orange-500/10 text-[10px] text-orange-400">
                  ⚠️ 含 Section 301 附加关税：${result.section301.toFixed(2)}
                </div>
              )}
            </div>

            <div className="text-center">
              <a href="/" className="text-xs text-cyan-400/50 hover:text-cyan-400 transition-colors">
                ← 使用 AI 拍照自动识别 HS 编码
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-[10px] text-white/20">
          数据来源：GlobalGuard HS 数据库 · 更新于 {dataUpdated}
        </div>
      </main>
    </div>
  );
}
