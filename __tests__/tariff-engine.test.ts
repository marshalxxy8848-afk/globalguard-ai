import { describe, it, expect } from 'vitest';
import { lookupUsTariff, lookupEuTariff, calculateLandedCost, getChapterName, getChapterNotes } from '@/lib/tariff-engine';

describe('lookupUsTariff', () => {
  it('returns 0% for headphones from China', () => {
    const r = lookupUsTariff('851830', 'china', 50);
    expect(r.adValorem).toBe(0);
    expect(r.section301).toBe(12.5); // 50 * 0.25
    expect(r.totalDuty).toBe(12.5);
    expect(r.rateDisplay).toContain('301');
    expect(r.matchLevel).toBe('6-digit');
    expect(r.riskLevel).toBe('medium'); // 12.5 > 10
  });

  it('returns correct duty for headphones from Vietnam (no 301)', () => {
    const r = lookupUsTariff('851830', 'vietnam', 50);
    expect(r.adValorem).toBe(0);
    expect(r.totalDuty).toBe(0);
    expect(r.t86Qualifies).toBe(true);
  });

  it('charges 16% for T-shirts from China + 7.5% 301', () => {
    const r = lookupUsTariff('610910', 'china', 100);
    expect(r.adValorem).toBeCloseTo(16, 1); // 100 * 0.16
    expect(r.section301).toBeCloseTo(7.5, 1); // 100 * 0.075
    expect(r.totalDuty).toBeCloseTo(23.5, 1);
  });

  it('applies chapter-level fallback for unknown 6-digit code', () => {
    const r = lookupUsTariff('999999', 'china', 50);
    expect(r.matchLevel).toBe('chapter');
    expect(r.totalDuty).toBeGreaterThan(0);
  });

  it('does NOT apply Section 301 to non-China origin', () => {
    const r = lookupUsTariff('851830', 'mexico', 50);
    expect(r.section301).toBe(0);
    expect(r.section301Label).toContain('无');
  });
});

describe('lookupEuTariff', () => {
  it('returns correct EU duty for headphones', () => {
    const r = lookupEuTariff('851830', 50);
    expect(r.duty).toBeCloseTo(1, 1); // 50 * 0.02
    expect(r.vat).toBeGreaterThan(0);
    expect(r.total).toBeGreaterThan(0);
  });

  it('applies country-specific VAT', () => {
    const de = lookupEuTariff('851830', 50, 'de');
    const hu = lookupEuTariff('851830', 50, 'hu');
    expect(de.vatRate).toBe(19);
    expect(hu.vatRate).toBe(27);
    expect(hu.total).toBeGreaterThan(de.total);
  });
});

describe('calculateLandedCost', () => {
  it('calculates US and EU landed cost correctly', () => {
    const l = calculateLandedCost(50, 8, 10, 2, 5);
    expect(l.usDuty).toBe(10);
    expect(l.euDuty).toBe(2);
    expect(l.euVat).toBe(5);
    expect(l.grandTotalUs).toBe(68); // 50 + 8 + 10
    expect(l.grandTotalEu).toBe(65); // 50 + 8 + 2 + 5
  });
});

describe('getChapterName', () => {
  it('returns correct names', () => {
    expect(getChapterName('85')).toBe('电机电气设备');
    expect(getChapterName('64')).toBe('鞋类');
    expect(getChapterName('99')).toBe('其他商品');
  });
});

describe('getChapterNotes', () => {
  it('returns notes for known chapters', () => {
    expect(getChapterNotes('85')).toContain('耳机');
  });
});
