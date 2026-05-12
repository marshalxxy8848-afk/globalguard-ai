import { describe, it, expect } from 'vitest';
import { HS_TARIFF_DATA, lookupHs6, lookupHs4Rate, HS_TARIFF_COUNT } from '@/lib/hs-tariff-data';

describe('hs-tariff-data', () => {
  it('has at least 281 entries', () => {
    expect(HS_TARIFF_COUNT).toBeGreaterThanOrEqual(281);
  });

  it('every entry has valid fields', () => {
    for (const e of HS_TARIFF_DATA) {
      expect(e.code6).toMatch(/^\d{6}$/);
      expect(e.code4).toBe(e.code6.slice(0, 4));
      expect(e.chapter).toBe(e.code6.slice(0, 2));
      expect(e.usRate).toBeGreaterThanOrEqual(0);
      expect(e.euRate).toBeGreaterThanOrEqual(0);
      expect(e.description).toBeTruthy();
      expect(e.descriptionEn).toBeTruthy();
    }
  });

  it('no duplicate 6-digit codes', () => {
    const codes = HS_TARIFF_DATA.map((e) => e.code6);
    expect(new Set(codes).size).toBe(codes.length);
  });

  // Spot checks: known rates
  it('headphones 851830 are duty-free in US', () => {
    const h = lookupHs6('851830');
    expect(h?.usRate).toBe(0);
  });

  it('T-shirts 610910 have 16% US rate', () => {
    const t = lookupHs6('610910');
    expect(t?.usRate).toBe(0.16);
  });

  it('power bank 850760 has 2.7% US rate', () => {
    const p = lookupHs6('850760');
    expect(p?.usRate).toBe(0.027);
  });

  it('returns null for nonexistent code', () => {
    expect(lookupHs6('999999')).toBeUndefined();
  });

  it('4-digit lookup returns array for valid heading', () => {
    const r = lookupHs4Rate('8518');
    expect(r).toBeTruthy();
    expect(r!.usRate).toBeGreaterThan(0);
  });
});
