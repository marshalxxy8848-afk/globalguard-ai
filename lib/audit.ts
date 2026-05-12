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
    section301: number;
    section301Label: string;
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
  landedCost: {
    declaredValue: number;
    shippingEstimate: number;
    usDuty: number;
    euDuty: number;
    euVat: number;
    totalDuty: number;
    grandTotalUs: number;
    grandTotalEu: number;
  };
  compliance: {
    dangerous: boolean;
    dangerousLabel: string;
    fda: boolean;
    fdaLabel: string;
    ce: boolean;
    ceLabel: string;
    battery: boolean;
    batteryLabel: string;
    ipRisk: boolean;
    ipRiskLabel: string;
  };
  restricted: boolean;
  conditions: string;
  taxRebate: number | null;
  suggestedPrice: number;
  shipmentRecommended: boolean;
  shipmentReason: string;
  overallRisk: 'low' | 'medium' | 'high';
  suggestedDeclaration: string;
  dataSource: string;
  dataUpdated: string;
  warnings: string[];
}

// US tariff assumptions (post-T86 scenario)
const US_FLAT_RATE = 25;
const US_AD_VALOREM = 0.30;

// Estimated shipping cost by origin ($/kg typical)
const SHIPPING_ESTIMATES: Record<string, number> = {
  china: 8,
  vietnam: 10,
  thailand: 12,
  mexico: 15,
};

// Compliance checks based on HS category + description
function checkCompliance(item: CategoryItem | undefined, material: string, usage: string): AuditReport['compliance'] {
  const cat = item?.category ?? '';
  const desc = (item?.description ?? '').toLowerCase() + ' ' + material.toLowerCase() + ' ' + usage.toLowerCase();
  const defaultResult = { dangerous: false, dangerousLabel: '', fda: false, fdaLabel: '', ce: false, ceLabel: '', battery: false, batteryLabel: '', ipRisk: false, ipRiskLabel: '' };

  if (!item) return defaultResult;

  const result = { ...defaultResult };

  // Dangerous goods: chemicals, pesticides, solvents
  if (cat === 'chemicals' || desc.includes('杀虫') || desc.includes('溶剂') || desc.includes('flammable') || desc.includes('气溶胶')) {
    result.dangerous = true;
    result.dangerousLabel = '危险品 — 运输受限，需提供 MSDS';
  }

  // FDA: food, cosmetics, certain chemicals
  if (cat === 'food' || cat === 'beauty' || (cat === 'chemicals' && (desc.includes('护肤') || desc.includes('清洁')))) {
    result.fda = true;
    result.fdaLabel = 'FDA 监管 — 进口美国需 FDA 注册';
  }

  // CE: electronics, toys (EU mandatory)
  if (cat === 'electronics' || cat === 'toys' || cat === 'machinery') {
    result.ce = true;
    result.ceLabel = 'CE 认证 — 出口欧盟需 CE 标志';
  }

  // Battery risk: common in electronics
  if (desc.includes('蓝牙') || desc.includes('无线') || desc.includes('电动') || desc.includes('电池') || desc.includes('可充电') || item.hs_code.startsWith('8517') || item.hs_code.startsWith('852')) {
    result.battery = true;
    result.batteryLabel = '含电池 — 需 UN38.3 测试，IATA 运输限制';
  }

  // IP risk: toys, footwear, bags, watches, branded goods
  if (cat === 'toys' || cat === 'footwear' || item.hs_code.startsWith('4202') || item.hs_code.startsWith('9102') || item.hs_code.startsWith('9504')) {
    result.ipRisk = true;
    result.ipRiskLabel = '侵权风险高 — 确认品牌/外观专利/商标合规';
  }

  return result;
}

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
  shippingEstimate?: number,
): AuditReport {
  const dbItem = findByHsCode(hsCode);
  const warnings: string[] = [];

  // Section 301 tariff
  const section301rate = dbItem?.section_301_tariff ?? 0;
  const section301Amount = declaredValue * quantity * section301rate;

  // US duty calculation
  const usAdValorem = declaredValue * quantity * US_AD_VALOREM;
  const usFlatRate = US_FLAT_RATE * quantity;
  const usBaseDuty = Math.max(usAdValorem, usFlatRate);
  const usDuty = usBaseDuty + section301Amount;
  const usDutySource = usAdValorem >= usFlatRate ? '30% 从价税' : '$25 固定费率';

  // T86 impact assessment
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

  // Compliance check
  const compliance = checkCompliance(dbItem, material, usage);

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

  // Compliance warnings
  if (compliance.dangerous) warnings.push(compliance.dangerousLabel);
  if (compliance.battery) warnings.push(compliance.batteryLabel);
  if (compliance.ipRisk) warnings.push(compliance.ipRiskLabel);

  // Section 301 warning
  if (section301rate > 0) {
    warnings.push(`Section 301 附加关税：${(section301rate * 100).toFixed(1)}% — 适用于中国原产商品。`);
  }

  // Suggested declaration description
  const suggestedDeclaration = aiDeclaration ?? [
    productName,
    material ? `由${material}制成` : '',
    `用于${usage}`,
  ]
    .filter(Boolean)
    .join('，')
    .slice(0, 120);

  // Regulatory conditions warning
  if (dbItem?.conditions) {
    warnings.push(`监管条件：${dbItem.conditions} — 请确认出口资质。`);
  }

  // Landed cost
  const shipping = shippingEstimate ?? SHIPPING_ESTIMATES[originCountry] ?? 10;
  const totalDutyUs = Math.round((usDuty + euDuty) * 100) / 100;
  const totalDutyEu = Math.round((euDuty + usDuty) * 100) / 100;
  const grandUs = Math.round((declaredValue * quantity + shipping + usDuty + euVat) * 100) / 100;
  const grandEu = Math.round((declaredValue * quantity + shipping + euDuty + euVat) * 100) / 100;

  // Suggested retail price
  const baseCost = declaredValue * quantity + shipping;
  const markupMultiplier = overallRisk === 'high' ? 2.5 : overallRisk === 'medium' ? 2.0 : 1.5;
  const suggestedPrice = Math.round((baseCost + usDuty + euDuty + euVat) * markupMultiplier * 100) / 100;

  // Shipment recommendation
  const hasChinaTariff = isChina && (section301rate > 0 || usDuty > 10);
  const shipmentRecommended = !hasChinaTariff && !compliance.battery && !compliance.dangerous;
  const shipmentReason = hasChinaTariff
    ? '中国原产商品受 T86 取消及/或 Section 301 附加关税影响。建议：1) 分批次小包裹发货 2) 考虑第三国中转仓转口 3) 评估产地多元化策略。'
    : compliance.battery || compliance.dangerous
      ? '含电池/危险品，运输受限。需使用特定物流渠道并提供 MSDS/UN38.3 报告。'
      : '当前产地无额外关税运输限制，可直接发运。';

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
      section301: Math.round(section301Amount * 100) / 100,
      section301Label: section301rate > 0 ? `含 ${(section301rate * 100).toFixed(1)}% 301 附加关税` : '无 301 附加关税',
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
    landedCost: {
      declaredValue,
      shippingEstimate: shipping,
      usDuty: Math.round(usDuty * 100) / 100,
      euDuty: Math.round(euDuty * 100) / 100,
      euVat: Math.round(euVat * 100) / 100,
      totalDuty: totalDutyUs,
      grandTotalUs: grandUs,
      grandTotalEu: grandEu,
    },
    compliance,
    restricted,
    conditions: dbItem?.conditions ?? '',
    taxRebate: dbItem?.tax_rebate ?? null,
    suggestedPrice,
    shipmentRecommended,
    shipmentReason,
    overallRisk,
    suggestedDeclaration,
    dataSource: 'GlobalGuard 本地数据库',
    dataUpdated: getLastUpdated(),
    warnings,
  };
}
