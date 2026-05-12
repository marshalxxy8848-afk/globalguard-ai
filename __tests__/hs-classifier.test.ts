import { describe, it, expect } from 'vitest';
import { classifyProduct, getClassificationExplanation } from '@/lib/hs-classifier';

describe('classifyProduct', () => {
  it('classifies Bluetooth headphones', () => {
    const r = classifyProduct('蓝牙耳机', '塑料', '音频');
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.bestMatch?.code6).toBe('851830');
    expect(r.confidence).toBe('high');
  });

  it('classifies leather handbag', () => {
    const r = classifyProduct('女士手提包', '皮革', '携带');
    expect(r.bestMatch?.code6).toBe('420222');
    expect(r.confidence).toBe('high');
  });

  it('classifies cotton T-shirt', () => {
    const r = classifyProduct('纯棉T恤', '棉', '穿着');
    expect(r.bestMatch?.code6).toBe('610910');
  });

  it('classifies smartphone case', () => {
    const r = classifyProduct('手机壳', '硅胶', '保护');
    expect(r.bestMatch?.code6).toBe('851770');
  });

  it('classifies power bank', () => {
    const r = classifyProduct('充电宝', '塑料', '充电');
    expect(r.bestMatch?.code6).toBe('850760');
  });

  it('falls back to AI suggestions when no rule matches', () => {
    const r = classifyProduct('xyzzy-unrecognizable-thing', '', '', undefined, ['847130']);
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.notes.some((n) => n.includes('AI 建议'))).toBe(true);
  });

  it('does not return more than 5 candidates', () => {
    const r = classifyProduct('衣服', '棉', '穿着');
    expect(r.candidates.length).toBeLessThanOrEqual(5);
  });

  it('generates explanation text', () => {
    const r = classifyProduct('蓝牙耳机', '塑料', '音频');
    if (r.bestMatch) {
      const exp = getClassificationExplanation(r.bestMatch);
      expect(exp).toContain('851830');
      expect(exp).toContain('%');
    }
  });
});
