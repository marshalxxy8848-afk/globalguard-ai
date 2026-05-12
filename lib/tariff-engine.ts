// --- Tariff Rule Engine ---
// Multi-country tariff rates with 6-digit → 4-digit → chapter-level fallback

import { lookupHs6, lookupHs4, lookupHs4Rate } from './hs-tariff-data';

/** Get the HS chapter prefix from a 6-digit HS code */
function getHsChapter(hsCode: string): string {
  return hsCode.replace(/\D/g, '').slice(0, 2);
}

export type CountryCode = 'china' | 'vietnam' | 'thailand' | 'mexico' | 'japan' | 'korea';

export interface TariffRate {
  /** Ad valorem rate as decimal (e.g. 0.03 = 3%) */
  adValorem: number;
  /** Specific rate in USD per unit (0 if ad-valorem only) */
  specificRate: number;
  /** Unit for specific rate (e.g. 'kg', 'pair', 'unit') */
  specificUnit?: string;
  /** Column 2 rate (for non-MFN countries) */
  column2?: number;
  /** Notes about this rate */
  notes?: string;
}

export interface TariffResult {
  adValorem: number;
  specific: number;
  totalDuty: number;
  rateDisplay: string;
  calculation: string;
  section301: number;
  section301Label: string;
  t86Qualifies: boolean;
  t86Note: string;
  riskLevel: 'low' | 'medium' | 'high';
  matchLevel: '6-digit' | '4-digit' | 'chapter';
}

export interface EuTariffResult {
  duty: number;
  vat: number;
  total: number;
  dutyRate: string;
  vatRate: number;
  calculation: string;
  riskLevel: 'low' | 'medium' | 'high';
  matchLevel: '6-digit' | '4-digit' | 'chapter';
}

// === US Tariff Database (chapter-level fallback) ===

interface UsTariffEntry {
  chapterStart: string;
  chapterEnd: string;
  description: string;
  rateGeneral: number;
  rateSpecial: number;
  specific: number;
  specificUnit: string;
  section301: number;
  notes: string;
}

const US_TARIFF_TABLE: UsTariffEntry[] = [
  { chapterStart: '02', chapterEnd: '02', description: '肉类', rateGeneral: 0.26, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '03', chapterEnd: '03', description: '水产品', rateGeneral: 0.06, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '07', chapterEnd: '07', description: '蔬菜', rateGeneral: 0.08, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '08', chapterEnd: '08', description: '水果', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '09', chapterEnd: '09', description: '咖啡茶香料', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '16', chapterEnd: '16', description: '加工食品', rateGeneral: 0.07, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '20', chapterEnd: '20', description: '食品制品', rateGeneral: 0.06, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '25', chapterEnd: '25', description: '矿产品', rateGeneral: 0.02, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '28', chapterEnd: '28', description: '无机化学品', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '29', chapterEnd: '29', description: '有机化学品', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '30', chapterEnd: '30', description: '药品', rateGeneral: 0, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0, notes: '零关税 — 人道主义商品' },
  { chapterStart: '33', chapterEnd: '33', description: '精油及化妆品', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '34', chapterEnd: '34', description: '肥皂洗涤剂', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '38', chapterEnd: '38', description: '杂项化学品', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '39', chapterEnd: '40', description: '塑料及橡胶制品', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '42', chapterEnd: '42', description: '皮革制品（箱包）', rateGeneral: 0.08, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '高 IP 风险类别' },
  { chapterStart: '43', chapterEnd: '43', description: '毛皮制品', rateGeneral: 0.06, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '44', chapterEnd: '46', description: '木及木制品', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '48', chapterEnd: '49', description: '纸及纸制品', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '50', chapterEnd: '55', description: '纺织原料及面料', rateGeneral: 0.08, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '关税范围 5-32%，此为平均值' },
  { chapterStart: '56', chapterEnd: '60', description: '特种织物', rateGeneral: 0.08, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '61', chapterEnd: '62', description: '服装', rateGeneral: 0.16, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '关税范围 6-32%' },
  { chapterStart: '63', chapterEnd: '63', description: '其他纺织制品', rateGeneral: 0.07, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '64', chapterEnd: '64', description: '鞋类', rateGeneral: 0.12, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '关税范围 0-48%，高 IP 风险' },
  { chapterStart: '65', chapterEnd: '65', description: '帽类', rateGeneral: 0.06, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '68', chapterEnd: '70', description: '石料陶瓷玻璃制品', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '71', chapterEnd: '71', description: '珠宝首饰', rateGeneral: 0.06, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '银饰 13.5%，金饰 0%' },
  { chapterStart: '72', chapterEnd: '73', description: '钢铁制品', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '74', chapterEnd: '81', description: '其他金属制品', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '82', chapterEnd: '83', description: '金属工具及器具', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '84', chapterEnd: '84', description: '机械设备', rateGeneral: 0.02, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '多数 0-4%' },
  { chapterStart: '85', chapterEnd: '85', description: '电机电气设备', rateGeneral: 0.02, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '含耳机/蓝牙/充电器等' },
  { chapterStart: '86', chapterEnd: '86', description: '铁道车辆', rateGeneral: 0.02, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '87', chapterEnd: '87', description: '车辆（非铁道）', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '自行车 0-11%' },
  { chapterStart: '90', chapterEnd: '90', description: '光学医疗仪器', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '91', chapterEnd: '91', description: '钟表', rateGeneral: 0.05, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.075, notes: '' },
  { chapterStart: '92', chapterEnd: '92', description: '乐器', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '94', chapterEnd: '94', description: '家具及照明', rateGeneral: 0.03, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '' },
  { chapterStart: '95', chapterEnd: '95', description: '玩具及体育用品', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '含儿童用品 CE 要求' },
  { chapterStart: '96', chapterEnd: '96', description: '杂项制品', rateGeneral: 0.04, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0.25, notes: '含笔/伞/拉链等' },
  { chapterStart: '97', chapterEnd: '97', description: '艺术品', rateGeneral: 0, rateSpecial: 0, specific: 0, specificUnit: '', section301: 0, notes: '零关税' },
];

// === EU TARIC Rates (chapter-level fallback) ===

interface EuTariffEntry {
  chapterStart: string;
  chapterEnd: string;
  description: string;
  rate: number;
  notes: string;
}

const EU_TARIFF_TABLE: EuTariffEntry[] = [
  { chapterStart: '02', chapterEnd: '02', description: '肉类', rate: 0.20, notes: '' },
  { chapterStart: '03', chapterEnd: '03', description: '水产品', rate: 0.08, notes: '' },
  { chapterStart: '07', chapterEnd: '07', description: '蔬菜', rate: 0.10, notes: '' },
  { chapterStart: '08', chapterEnd: '08', description: '水果', rate: 0.06, notes: '' },
  { chapterStart: '16', chapterEnd: '16', description: '加工食品', rate: 0.10, notes: '' },
  { chapterStart: '20', chapterEnd: '20', description: '食品制品', rate: 0.08, notes: '' },
  { chapterStart: '28', chapterEnd: '38', description: '化学品', rate: 0.05, notes: '' },
  { chapterStart: '39', chapterEnd: '40', description: '塑料橡胶', rate: 0.06, notes: '' },
  { chapterStart: '42', chapterEnd: '42', description: '皮革箱包', rate: 0.05, notes: '' },
  { chapterStart: '44', chapterEnd: '46', description: '木制品', rate: 0.04, notes: '' },
  { chapterStart: '48', chapterEnd: '49', description: '纸制品', rate: 0.03, notes: '' },
  { chapterStart: '50', chapterEnd: '55', description: '纺织品', rate: 0.08, notes: '' },
  { chapterStart: '61', chapterEnd: '62', description: '服装', rate: 0.12, notes: '' },
  { chapterStart: '63', chapterEnd: '63', description: '其他纺织', rate: 0.06, notes: '' },
  { chapterStart: '64', chapterEnd: '64', description: '鞋类', rate: 0.08, notes: '' },
  { chapterStart: '68', chapterEnd: '70', description: '陶瓷玻璃', rate: 0.05, notes: '' },
  { chapterStart: '71', chapterEnd: '71', description: '珠宝', rate: 0.04, notes: '' },
  { chapterStart: '72', chapterEnd: '83', description: '金属制品', rate: 0.03, notes: '' },
  { chapterStart: '84', chapterEnd: '84', description: '机械设备', rate: 0.02, notes: '' },
  { chapterStart: '85', chapterEnd: '85', description: '电气设备', rate: 0.02, notes: '含电子消费品 0-4%' },
  { chapterStart: '87', chapterEnd: '87', description: '车辆', rate: 0.04, notes: '' },
  { chapterStart: '90', chapterEnd: '90', description: '光学医疗', rate: 0.02, notes: '' },
  { chapterStart: '91', chapterEnd: '91', description: '钟表', rate: 0.05, notes: '' },
  { chapterStart: '94', chapterEnd: '94', description: '家具', rate: 0.03, notes: '' },
  { chapterStart: '95', chapterEnd: '95', description: '玩具', rate: 0.04, notes: '含儿童用品 CE 要求' },
  { chapterStart: '96', chapterEnd: '96', description: '杂项', rate: 0.03, notes: '' },
];

// === Shipping cost estimates by origin country ===

export const SHIPPING_ESTIMATES: Record<string, number> = {
  china: 8,
  vietnam: 10,
  thailand: 12,
  mexico: 15,
  japan: 18,
  korea: 14,
};

// === Helper functions ===

/** Check if a chapter number falls within a chapter range */
function chapterInRange(chapter: string, start: string, end: string): boolean {
  return chapter >= start && chapter <= end;
}

/**
 * Multi-level US tariff lookup:
 * 1. Try exact 6-digit match in comprehensive database
 * 2. Try 4-digit heading match
 * 3. Fall back to chapter-level table
 */
export function lookupUsTariff(hsCode: string, originCountry: string, declaredValue: number, quantity: number = 1): TariffResult {
  const chapter = getHsChapter(hsCode);
  const isChina = originCountry === 'china';

  // Extract 4-digit and 6-digit codes for precise lookup
  const cleanCode = hsCode.replace(/\D/g, '').slice(0, 6);
  const code6 = cleanCode.length === 6 ? cleanCode : cleanCode.padEnd(6, '0');
  const code4 = code6.slice(0, 4);

  let matchLevel: '6-digit' | '4-digit' | 'chapter' = 'chapter';
  let baseRate: number;
  let section301Rate: number;
  let specificRate = 0;
  let rateNote = '';

  // Level 1: Try 6-digit exact match
  const entry6 = lookupHs6(code6);
  if (entry6) {
    baseRate = entry6.usRate;
    section301Rate = isChina ? entry6.section301 : 0;
    matchLevel = '6-digit';
    rateNote = `6位编码 ${code6} 精确匹配`;
  } else {
    // Level 2: Try 4-digit heading match (use representative rate)
    const entry4 = lookupHs4Rate(code4);
    if (entry4) {
      baseRate = entry4.usRate;
      section301Rate = isChina ? entry4.section301 : 0;
      matchLevel = '4-digit';
      rateNote = `4位品目 ${code4} 品目匹配`;
    } else {
      // Level 3: Fall back to chapter-level
      const chapterEntry = US_TARIFF_TABLE.find((e) => chapterInRange(chapter, e.chapterStart, e.chapterEnd));
      baseRate = chapterEntry?.rateGeneral ?? 0.03;
      section301Rate = (isChina && chapterEntry?.section301) ? chapterEntry.section301 : 0;
      specificRate = chapterEntry?.specific ?? 0;
      matchLevel = 'chapter';
      rateNote = `章节 ${chapter} 近似匹配`;
    }
  }

  // Ad valorem calculation
  const adValoremAmount = declaredValue * quantity * baseRate;

  // Specific rate calculation (only at chapter level)
  const specificAmount = specificRate * quantity;

  // Section 301 additional
  const section301Amount = declaredValue * quantity * section301Rate;

  // Total duty
  const baseDuty = adValoremAmount + specificAmount;
  const totalDuty = baseDuty + section301Amount;

  // T86 de minimis check
  const t86Qualifies = totalDuty < 800 && !isChina;
  const t86Note = isChina
    ? 'T86 小额豁免已取消对中国包裹的适用。'
    : t86Qualifies
      ? `货值 $${declaredValue} 未超 $800 免税额，可适用 T86 小额豁免。`
      : `货值 $${declaredValue} 超过 $800 免税额，需按常规报关。`;

  // Rate display
  const parts: string[] = [];
  if (baseRate > 0) parts.push(`${(baseRate * 100).toFixed(1)}%`);
  if (specificRate > 0) parts.push(`$${specificRate}/件`);
  if (section301Rate > 0) parts.push(`+301 ${(section301Rate * 100).toFixed(1)}%`);

  // Calculation
  const calcParts: string[] = [];
  calcParts.push(`[${matchLevel}] ${rateNote}`);
  if (baseRate > 0) calcParts.push(`$${declaredValue} × ${(baseRate * 100).toFixed(1)}% = $${(adValoremAmount).toFixed(2)}`);
  if (section301Rate > 0) calcParts.push(`301: $${declaredValue} × ${(section301Rate * 100).toFixed(1)}% = $${section301Amount.toFixed(2)}`);

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (totalDuty > 20) riskLevel = 'high';
  else if (totalDuty > 10) riskLevel = 'medium';

  return {
    adValorem: Math.round(adValoremAmount * 100) / 100,
    specific: Math.round(specificAmount * 100) / 100,
    totalDuty: Math.round(totalDuty * 100) / 100,
    rateDisplay: parts.join(' + ') || '0%',
    calculation: calcParts.join('; '),
    section301: Math.round(section301Amount * 100) / 100,
    section301Label: section301Rate > 0 ? `含 ${(section301Rate * 100).toFixed(1)}% 301 附加关税` : '无 301 附加关税',
    t86Qualifies,
    t86Note,
    riskLevel,
    matchLevel,
  };
}

/**
 * Multi-level EU tariff lookup:
 * 1. Try exact 6-digit match
 * 2. Try 4-digit heading match
 * 3. Fall back to chapter-level table
 */
export function lookupEuTariff(hsCode: string, declaredValue: number, euCountry?: string, quantity: number = 1): EuTariffResult {
  const { getEuVatRate } = require('./eu-vat');
  const chapter = getHsChapter(hsCode);

  const cleanCode = hsCode.replace(/\D/g, '').slice(0, 6);
  const code6 = cleanCode.length === 6 ? cleanCode : cleanCode.padEnd(6, '0');
  const code4 = code6.slice(0, 4);

  let matchLevel: '6-digit' | '4-digit' | 'chapter' = 'chapter';
  let dutyRate: number;

  // Level 1: Try 6-digit exact match
  const entry6 = lookupHs6(code6);
  if (entry6) {
    dutyRate = entry6.euRate;
    matchLevel = '6-digit';
  } else {
    // Level 2: Try 4-digit heading match
    const entry4 = lookupHs4Rate(code4);
    if (entry4) {
      dutyRate = entry4.euRate;
      matchLevel = '4-digit';
    } else {
      // Level 3: Fall back to chapter
      const entry = EU_TARIFF_TABLE.find((e) => chapterInRange(chapter, e.chapterStart, e.chapterEnd));
      dutyRate = entry?.rate ?? 0.03;
      matchLevel = 'chapter';
    }
  }

  const vatRate = getEuVatRate(euCountry);

  const duty = declaredValue * quantity * dutyRate;
  const vat = (declaredValue * quantity + duty) * vatRate;
  const total = duty + vat;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (total > 30) riskLevel = 'high';
  else if (total > 15) riskLevel = 'medium';

  return {
    duty: Math.round(duty * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
    dutyRate: `${(dutyRate * 100).toFixed(1)}%`,
    vatRate: Math.round(vatRate * 100 * 10) / 10,
    calculation: `[${matchLevel}] 关税: $${declaredValue} × ${(dutyRate * 100).toFixed(1)}% = $${duty.toFixed(2)}; VAT: ($${declaredValue} + $${duty.toFixed(2)}) × ${(vatRate * 100).toFixed(1)}% = $${vat.toFixed(2)}`,
    riskLevel,
    matchLevel,
  };
}

/** Calculate landed cost breakdown */
export function calculateLandedCost(
  declaredValue: number,
  shippingEstimate: number,
  usDuty: number,
  euDuty: number,
  euVat: number,
  quantity: number = 1,
) {
  const totalDuty = Math.round((usDuty + euDuty) * 100) / 100;
  return {
    declaredValue,
    shippingEstimate,
    usDuty: Math.round(usDuty * 100) / 100,
    euDuty: Math.round(euDuty * 100) / 100,
    euVat: Math.round(euVat * 100) / 100,
    totalDuty,
    grandTotalUs: Math.round((declaredValue * quantity + shippingEstimate + usDuty) * 100) / 100,
    grandTotalEu: Math.round((declaredValue * quantity + shippingEstimate + euDuty + euVat) * 100) / 100,
  };
}

/** Get human-readable chapter name */
export function getChapterName(chapter: string): string {
  const entry = US_TARIFF_TABLE.find((e) => chapterInRange(chapter, e.chapterStart, e.chapterEnd));
  return entry?.description || '其他商品';
}

/** Get tariff notes for a chapter (e.g. IP risk, CE requirements) */
export function getChapterNotes(chapter: string): string {
  const entry = US_TARIFF_TABLE.find((e) => chapterInRange(chapter, e.chapterStart, e.chapterEnd));
  return entry?.notes || '';
}
