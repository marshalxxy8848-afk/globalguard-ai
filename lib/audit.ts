import { findByHsCode, getLastUpdated, type CategoryItem } from './hs-codes';
import { getEuVatRate, getEuCountryName } from './eu-vat';

export interface AuditReport {
  productName: string;
  material: string;
  usage: string;
  selectedHsCode: string;
  hsDescription: string;
  us: {
    estimatedDuty: number;
    dutyRate: string;
    calculation: string;
    t86Impact: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  eu: {
    estimatedDuty: number;
    estimatedVat: number;
    totalEu: number;
    dutyRate: string;
    vatRate: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  restricted: boolean;
  conditions: string;       // 监管条件代码
  taxRebate: number | null; // 出口退税率百分比
  overallRisk: 'low' | 'medium' | 'high';
  suggestedDeclaration: string;
  dataSource: string;       // 数据来源
  dataUpdated: string;      // 数据更新日期
  warnings: string[];
}

// US tariff assumptions (post-T86 scenario)
const US_FLAT_RATE = 25;       // $25/package
const US_AD_VALOREM = 0.30;    // 30% ad valorem
// EU VAT rate is now dynamic per country via getEuVatRate()

export function generateAuditReport(
  productName: string,
  material: string,
  usage: string,
  hsCode: string,
  aiDeclaration?: string,
  aiHsDescription?: string,
  declaredValue: number = 50,
  quantity: number = 1,
  originCountry: string = 'china',
  euCountry?: string,
): AuditReport {
  const dbItem = findByHsCode(hsCode);
  const warnings: string[] = [];

  // US duty calculation
  const usAdValorem = declaredValue * quantity * US_AD_VALOREM;
  const usFlatRate = US_FLAT_RATE * quantity;
  const usDuty = Math.max(usAdValorem, usFlatRate);
  const usDutySource = usAdValorem >= usFlatRate ? '30% 从价税' : '$25 固定费率';

  // T86 impact assessment (China-specific policy)
  const isChina = originCountry === 'china';
  const t86Impact =
    usDuty > 0
      ? (isChina
          ? 'T86 小额豁免（$800 免税额）已对中国包裹取消，每包裹需缴纳关税。'
          : `${originCountry === 'vietnam' ? '越南' : originCountry === 'thailand' ? '泰国' : '墨西哥'}暂不受 T86 取消影响（当前仅针对中国包裹）。`)
      : '无 T86 影响。';

  // US risk level
  let usRisk: 'low' | 'medium' | 'high' = 'low';
  if (usDuty > 20) usRisk = 'high';
  else if (usDuty > 10) usRisk = 'medium';

  // EU duty calculation (dynamic VAT per country)
  const euVatRate = getEuVatRate(euCountry);
  const euDutyRate = dbItem ? dbItem.base_tariff_eu / 100 : 0.05;
  const euDuty = declaredValue * quantity * euDutyRate;
  const euVat = (declaredValue * quantity + euDuty) * euVatRate;
  const totalEu = euDuty + euVat;
  const euCountryLabel = euCountry ? getEuCountryName(euCountry) : 'EU';

  // EU risk level
  let euRisk: 'low' | 'medium' | 'high' = 'low';
  if (totalEu > 30) euRisk = 'high';
  else if (totalEu > 15) euRisk = 'medium';

  // Restricted item check
  const restricted = dbItem?.restricted || false;
  if (restricted) {
    warnings.push('该 HS 编码类别存在特殊管制要求，请确认出口许可。');
  }

  // Overall risk
  const riskOrder = { low: 0, medium: 1, high: 2 };
  const overallScore = Math.max(riskOrder[usRisk], riskOrder[euRisk]);
  const overallRisk = (['low', 'medium', 'high'] as const)[overallScore];

  if (usRisk === 'high' || euRisk === 'high') {
    warnings.push('高关税风险 — 建议优化 HS 编码选择或考虑产地策略。');
  }

  // Suggested declaration description (use AI Chinese value when available)
  const suggestedDeclaration = aiDeclaration ?? [
    productName,
    material ? `由${material}制成` : '',
    `用于${usage}`,
  ]
    .filter(Boolean)
    .join('，')
    .slice(0, 120);

  // Conditional warnings for regulatory conditions
  if (dbItem?.conditions) {
    warnings.push(`监管条件：${dbItem.conditions} — 请确认出口资质。`);
  }

  return {
    productName,
    material,
    usage,
    selectedHsCode: hsCode,
    hsDescription: aiHsDescription || dbItem?.description || '通用商品类别',
    us: {
      estimatedDuty: Math.round(usDuty * 100) / 100,
      dutyRate: `${(US_AD_VALOREM * 100).toFixed(0)}% or $${US_FLAT_RATE}/pc`,
      calculation: `$${declaredValue} × ${US_AD_VALOREM * 100}% = $${usAdValorem.toFixed(2)}，对比 $${US_FLAT_RATE}/件固定费率 → 采用${usDutySource}`,
      t86Impact,
      riskLevel: usRisk,
    },
    eu: {
      estimatedDuty: Math.round(euDuty * 100) / 100,
      estimatedVat: Math.round(euVat * 100) / 100,
      totalEu: Math.round(totalEu * 100) / 100,
      dutyRate: `${(euDutyRate * 100).toFixed(1)}%`,
      vatRate: Math.round(euVatRate * 100 * 10) / 10,
      riskLevel: euRisk,
    },
    restricted,
    conditions: dbItem?.conditions ?? '',
    taxRebate: dbItem?.tax_rebate ?? null,
    overallRisk,
    suggestedDeclaration,
    dataSource: 'GlobalGuard 本地数据库',
    dataUpdated: getLastUpdated(),
    warnings,
  };
}
