import { findByHsCode, getLastUpdated, type CategoryItem } from './hs-codes';
import { getEuVatRate, getEuCountryName } from './eu-vat';
import { lookupUsTariff, lookupEuTariff, calculateLandedCost, SHIPPING_ESTIMATES as ENGINE_SHIPPING } from './tariff-engine';

export type AuditLocale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

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
  platform: {
    name: string;
    label: string;
    commissionRate: number;
    fulfillmentFee: number;
    totalFee: number;
  };
  overallRisk: 'low' | 'medium' | 'high';
  estimatedProfit: number;
  profitMargin: number;
  profitRecommendation: 'recommended' | 'caution' | 'not_recommended';
  profitReason: string;
  countryComparison: { country: string; label: string; totalCost: number; duty: number }[];
  bestOriginCountry: string;
  bestOriginLabel: string;
  suggestedDeclaration: string;
  dataSource: string;
  dataUpdated: string;
  warnings: string[];
}

// === i18n label dictionaries for audit.ts ===

const L = {
  'zh-CN': {
    platform_none: '不指定',
    platform_temu: 'Temu 半托管',
    platform_tiktok: 'TikTok Shop',
    platform_amazon: 'Amazon FBA',
    platform_shopify: 'Shopify',
    platform_walmart: '沃尔玛 WFS',
    desc_temu: '平台佣金 5%，卖家承担物流',
    desc_tiktok: '平台佣金约 15%（含 affiliate）',
    desc_amazon: '佣金 15% + FBA 配货费约 $5/件',
    desc_shopify: '支付手续费 2.9% + $0.30',
    desc_walmart: '佣金约 15% + WFS 配货费约 $4/件',
    compliance_dangerous: '危险品 — 运输受限，需提供 MSDS',
    compliance_fda: 'FDA 监管 — 进口美国需 FDA 注册',
    compliance_ce: 'CE 认证 — 出口欧盟需 CE 标志',
    compliance_battery: '含电池 — 需 UN38.3 测试，IATA 运输限制',
    compliance_ip: '侵权风险高 — 确认品牌/外观专利/商标合规',
    warning_restricted: '该 HS 编码类别存在特殊管制要求，请确认出口许可。',
    warning_high_tariff: '高关税风险 — 建议优化 HS 编码选择或考虑产地策略。',
    warning_section301: 'Section 301 附加关税：适用中国原产商品。',
    warning_conditions: '监管条件：{0} — 请确认出口资质。',
    china: '中国',
    vietnam: '越南',
    thailand: '泰国',
    mexico: '墨西哥',
    suggested_decl: ['由{0}制成', '用于{0}'],
    hs_default: '通用商品类别',
    data_source: 'GlobalGuard 本地数据库',
    t86_no_t86: '无 T86 影响。',
    shipment_reason_china: '中国原产商品受 T86 取消及/或 Section 301 附加关税影响。建议：1) 分批次小包裹发货 2) 考虑第三国中转仓转口 3) 评估产地多元化策略。',
    shipment_reason_battery: '含电池/危险品，运输受限。需使用特定物流渠道并提供 MSDS/UN38.3 报告。',
    shipment_reason_ok: '当前产地无额外关税运输限制，可直接发运。',
    profit_recommended: '利润率 {0}%，利润空间充足，建议出单。',
    profit_caution: '利润率 {0}%，需优化成本或提高售价。考虑：1) 降低申报货值 2) 选择低税率产地 3) 提高终端售价。',
    profit_not_recommended: '利润率仅 {0}%，利润过低。不建议直接发运，建议：1) 提高售价 2) 更换低税率 HS 编码 3) 更换产地。',
  },
  'en-US': {
    platform_none: 'Not Specified',
    platform_temu: 'Temu Semi-托管',
    platform_tiktok: 'TikTok Shop',
    platform_amazon: 'Amazon FBA',
    platform_shopify: 'Shopify',
    platform_walmart: 'Walmart WFS',
    desc_temu: 'Commission 5%, seller arranges shipping',
    desc_tiktok: 'Commission ~15% (incl. affiliate)',
    desc_amazon: 'Commission 15% + FBA fulfillment ~$5/unit',
    desc_shopify: 'Payment processing 2.9% + $0.30',
    desc_walmart: 'Commission ~15% + WFS fulfillment ~$4/unit',
    compliance_dangerous: 'Dangerous goods — shipping restricted, MSDS required',
    compliance_fda: 'FDA regulated — FDA registration required for US import',
    compliance_ce: 'CE certified — CE marking required for EU export',
    compliance_battery: 'Contains battery — UN38.3 test required, IATA shipping restrictions',
    compliance_ip: 'High IP risk — verify brand/design patent/trademark compliance',
    warning_restricted: 'This HS category has special regulatory requirements. Confirm export license.',
    warning_high_tariff: 'High tariff risk — consider optimizing HS code selection or origin strategy.',
    warning_section301: 'Section 301 additional tariff: applies to Chinese-origin goods.',
    warning_conditions: 'Regulatory conditions: {0} — confirm export qualifications.',
    china: 'China',
    vietnam: 'Vietnam',
    thailand: 'Thailand',
    mexico: 'Mexico',
    suggested_decl: ['made of {0}', 'used for {0}'],
    hs_default: 'General merchandise category',
    data_source: 'GlobalGuard Local Database',
    t86_no_t86: 'No T86 impact.',
    shipment_reason_china: 'Chinese-origin goods affected by T86 cancellation and/or Section 301 tariffs. Suggestions: 1) Ship in smaller batches 2) Consider third-country transshipment 3) Evaluate origin diversification.',
    shipment_reason_battery: 'Contains battery/dangerous goods, shipping restricted. Use specialized logistics channels with MSDS/UN38.3 report.',
    shipment_reason_ok: 'No additional tariff restrictions from current origin. Ready to ship.',
    profit_recommended: 'Margin {0}%, sufficient profit. Recommend shipping.',
    profit_caution: 'Margin {0}%, needs cost optimization or higher pricing. Consider: 1) Lower declared value 2) Choose lower-tariff origin 3) Increase retail price.',
    profit_not_recommended: 'Margin only {0}%, too low. Not recommended. Suggestions: 1) Increase price 2) Switch to lower-tariff HS code 3) Change origin.',
  },
  'ja-JP': {
    platform_none: '指定なし',
    platform_temu: 'Temu セミ管理',
    platform_tiktok: 'TikTok Shop',
    platform_amazon: 'Amazon FBA',
    platform_shopify: 'Shopify',
    platform_walmart: 'Walmart WFS',
    desc_temu: '手数料5%、販売者が物流を手配',
    desc_tiktok: '手数料約15%（アフィリエイト含む）',
    desc_amazon: '手数料15% + FBAフルフィルメント約$5/個',
    desc_shopify: '決済手数料2.9% + $0.30',
    desc_walmart: '手数料約15% + WFSフルフィルメント約$4/個',
    compliance_dangerous: '危険物 — 輸送制限あり、MSDS提出必須',
    compliance_fda: 'FDA規制 — 米国輸入にはFDA登録が必要',
    compliance_ce: 'CE認証 — EU輸出にはCEマークが必要',
    compliance_battery: 'バッテリー内蔵 — UN38.3試験必須、IATA輸送制限あり',
    compliance_ip: '知的財産リスク高 — ブランド/意匠特許/商標の確認が必要',
    warning_restricted: 'このHSコード区分には特別な規制要件があります。輸出許可を確認してください。',
    warning_high_tariff: '高関税リスク — HSコードの最適化または原産国戦略の検討を推奨。',
    warning_section301: 'Section 301追加関税：中国原産品に適用。',
    warning_conditions: '規制条件：{0} — 輸出資格を確認してください。',
    china: '中国',
    vietnam: 'ベトナム',
    thailand: 'タイ',
    mexico: 'メキシコ',
    suggested_decl: ['{0}で製造', '{0}に使用'],
    hs_default: '一般商品カテゴリ',
    data_source: 'GlobalGuard ローカルデータベース',
    t86_no_t86: 'T86の影響なし。',
    shipment_reason_china: '中国原産品はT86免税廃止および/またはSection 301関税の影響を受けます。推奨：1) 小ロットで分割出荷 2) 第三国経由の積替え 3) 原産地多角化の検討。',
    shipment_reason_battery: 'バッテリー/危険物を含むため、輸送制限あり。MSDS/UN38.3レポートとともに専用物流ルートを使用してください。',
    shipment_reason_ok: '現在の原産地に関税制限はなく、直接出荷可能。',
    profit_recommended: '利益率 {0}%、十分な利益。出荷を推奨。',
    profit_caution: '利益率 {0}%、コスト最適化または価格引き上げが必要。検討：1) 申告価格の引下げ 2) 低関税原産地の選択 3) 販売価格の引上げ。',
    profit_not_recommended: '利益率 {0}%のみ、低すぎます。出荷非推奨。提案：1) 価格引上げ 2) 低関税HSコードへの変更 3) 原産地変更。',
  },
  'ko-KR': {
    platform_none: '지정되지 않음',
    platform_temu: 'Temu 세미 관리형',
    platform_tiktok: 'TikTok Shop',
    platform_amazon: 'Amazon FBA',
    platform_shopify: 'Shopify',
    platform_walmart: 'Walmart WFS',
    desc_temu: '수수료 5%, 판매자가 물류 주관',
    desc_tiktok: '수수료 약 15%(제휴 포함)',
    desc_amazon: '수수료 15% + FBA 풀필먼트 약 $5/개',
    desc_shopify: '결제 수수료 2.9% + $0.30',
    desc_walmart: '수수료 약 15% + WFS 풀필먼트 약 $4/개',
    compliance_dangerous: '위험물 — 운송 제한, MSDS 필요',
    compliance_fda: 'FDA 규제 — 미국 수입 시 FDA 등록 필요',
    compliance_ce: 'CE 인증 — EU 수출 시 CE 마크 필요',
    compliance_battery: '배터리 내장 — UN38.3 테스트 필요, IATA 운송 제한',
    compliance_ip: '지식재산권 리스크 높음 — 브랜드/디자인특허/상표 준수 확인 필요',
    warning_restricted: '이 HS 코드 카테고리에는 특별 규제 요건이 있습니다. 수출 허가를 확인하십시오.',
    warning_high_tariff: '고관세 위험 — HS 코드 최적화 또는 원산지 전략을 고려하십시오.',
    warning_section301: 'Section 301 추가 관세: 중국 원산 제품에 적용됩니다.',
    warning_conditions: '규제 조건: {0} — 수출 자격을 확인하십시오.',
    china: '중국',
    vietnam: '베트남',
    thailand: '태국',
    mexico: '멕시코',
    suggested_decl: ['{0}으로 제조', '{0}에 사용'],
    hs_default: '일반 상품 카테고리',
    data_source: 'GlobalGuard 로컬 데이터베이스',
    t86_no_t86: 'T86 영향 없음.',
    shipment_reason_china: '중국 원산 제품은 T86 면제 폐지 및/또는 Section 301 관세의 영향을 받습니다. 제안: 1) 소량 분할 발송 2) 제3국 환적 고려 3) 원산지 다각화 평가.',
    shipment_reason_battery: '배터리/위험물 포함, 운송 제한. MSDS/UN38.3 보고서와 함께 전문 물류 채널 사용 필요.',
    shipment_reason_ok: '현재 원산지에 추가 관세 제한 없음. 직접 발송 가능.',
    profit_recommended: '이익률 {0}%, 충분한 이익. 출고를 권장합니다.',
    profit_caution: '이익률 {0}%, 비용 최적화 또는 가격 인상 필요. 고려: 1) 신고 가격 인하 2) 저관세 원산지 선택 3) 판매 가격 인상.',
    profit_not_recommended: '이익률 {0}%에 불과, 너무 낮음. 출고 비권장. 제안: 1) 가격 인상 2) 저관세 HS 코드 변경 3) 원산지 변경.',
  },
};

function ll(locale: AuditLocale, key: keyof (typeof L)['zh-CN'], ...args: string[]): string {
  const dict = L[locale] ?? L['zh-CN'];
  let val = dict[key] ?? L['zh-CN'][key] ?? key;
  if (typeof val === 'string') {
    args.forEach((arg, i) => { val = (val as string).replace(`{${i}}`, arg); });
  }
  return val as string;
}

// Platform fee rates (commission % + fulfillment fee $ per unit)
export const PLATFORM_FEES: Record<string, { label: string; commissionRate: number; fulfillmentFee: number; description: string }> = {
  none: { label: '不指定', commissionRate: 0, fulfillmentFee: 0, description: '' },
  temu: { label: 'Temu 半托管', commissionRate: 0.05, fulfillmentFee: 0, description: '平台佣金 5%，卖家承担物流' },
  tiktok: { label: 'TikTok Shop', commissionRate: 0.15, fulfillmentFee: 0, description: '平台佣金约 15%（含 affiliate）' },
  amazon: { label: 'Amazon FBA', commissionRate: 0.15, fulfillmentFee: 5, description: '佣金 15% + FBA 配货费约 $5/件' },
  shopify: { label: 'Shopify', commissionRate: 0.029, fulfillmentFee: 0.3, description: '支付手续费 2.9% + $0.30' },
  walmart: { label: '沃尔玛 WFS', commissionRate: 0.15, fulfillmentFee: 4, description: '佣金约 15% + WFS 配货费约 $4/件' },
};

/** Get localized label for a platform */
export function getPlatformLabel(platform: string, locale: AuditLocale = 'zh-CN'): string {
  const map: Record<string, keyof (typeof L)['zh-CN']> = {
    none: 'platform_none', temu: 'platform_temu', tiktok: 'platform_tiktok',
    amazon: 'platform_amazon', shopify: 'platform_shopify', walmart: 'platform_walmart',
  };
  return ll(locale, (map[platform] || 'platform_none') as keyof (typeof L)['zh-CN']);
}

/** Get localized platform description */
export function getPlatformDescription(platform: string, locale: AuditLocale = 'zh-CN'): string {
  const map: Record<string, keyof (typeof L)['zh-CN']> = {
    temu: 'desc_temu', tiktok: 'desc_tiktok', amazon: 'desc_amazon',
    shopify: 'desc_shopify', walmart: 'desc_walmart',
  };
  return ll(locale, (map[platform] || 'platform_none') as keyof (typeof L)['zh-CN']);
}

/** Get localized country name */
export function getCountryLabel(country: string, locale: AuditLocale = 'zh-CN'): string {
  const map: Record<string, keyof (typeof L)['zh-CN']> = {
    china: 'china', vietnam: 'vietnam', thailand: 'thailand', mexico: 'mexico',
  };
  return ll(locale, (map[country] || 'china') as keyof (typeof L)['zh-CN']);
}

// Compliance checks based on HS category + description
function checkCompliance(item: CategoryItem | undefined, material: string, usage: string, locale: AuditLocale): AuditReport['compliance'] {
  const cat = item?.category ?? '';
  const desc = (item?.description ?? '').toLowerCase() + ' ' + material.toLowerCase() + ' ' + usage.toLowerCase();
  const defaultResult = { dangerous: false, dangerousLabel: '', fda: false, fdaLabel: '', ce: false, ceLabel: '', battery: false, batteryLabel: '', ipRisk: false, ipRiskLabel: '' };

  if (!item) return defaultResult;

  const result = { ...defaultResult };

  if (cat === 'chemicals' || desc.includes('杀虫') || desc.includes('溶剂') || desc.includes('flammable') || desc.includes('气溶胶')) {
    result.dangerous = true;
    result.dangerousLabel = ll(locale, 'compliance_dangerous');
  }

  if (cat === 'food' || cat === 'beauty' || (cat === 'chemicals' && (desc.includes('护肤') || desc.includes('清洁')))) {
    result.fda = true;
    result.fdaLabel = ll(locale, 'compliance_fda');
  }

  if (cat === 'electronics' || cat === 'toys' || cat === 'machinery') {
    result.ce = true;
    result.ceLabel = ll(locale, 'compliance_ce');
  }

  if (desc.includes('蓝牙') || desc.includes('无线') || desc.includes('电动') || desc.includes('电池') || desc.includes('可充电') || item.hs_code.startsWith('8517') || item.hs_code.startsWith('852')) {
    result.battery = true;
    result.batteryLabel = ll(locale, 'compliance_battery');
  }

  if (cat === 'toys' || cat === 'footwear' || item.hs_code.startsWith('4202') || item.hs_code.startsWith('9102') || item.hs_code.startsWith('9504')) {
    result.ipRisk = true;
    result.ipRiskLabel = ll(locale, 'compliance_ip');
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
  platform: string = 'none',
  locale: AuditLocale = 'zh-CN',
): AuditReport {
  const dbItem = findByHsCode(hsCode);
  const warnings: string[] = [];

  // === Tariff Engine Integration ===
  const usResult = lookupUsTariff(hsCode, originCountry, declaredValue, quantity);
  const euResult = lookupEuTariff(hsCode, declaredValue, euCountry, quantity);

  const usDuty = usResult.totalDuty;
  const section301Amount = usResult.section301;
  const isChina = originCountry === 'china';
  const t86Impact = usResult.t86Note;

  // US risk level (from tariff engine)
  const usRisk = usResult.riskLevel;

  // EU values (from tariff engine)
  const euDuty = euResult.duty;
  const euVat = euResult.vat;
  const totalEu = euResult.total;
  const euRisk = euResult.riskLevel;

  // Compliance check (localized)
  const compliance = checkCompliance(dbItem, material, usage, locale);

  // Restricted item check
  const restricted = dbItem?.restricted || false;
  if (restricted) {
    warnings.push(ll(locale, 'warning_restricted'));
  }

  // Overall risk
  const riskOrder = { low: 0, medium: 1, high: 2 };
  const overallScore = Math.max(riskOrder[usRisk], riskOrder[euRisk]);
  const overallRisk = (['low', 'medium', 'high'] as const)[overallScore];

  if (usRisk === 'high' || euRisk === 'high') {
    warnings.push(ll(locale, 'warning_high_tariff'));
  }

  // Compliance warnings
  if (compliance.dangerous) warnings.push(compliance.dangerousLabel);
  if (compliance.battery) warnings.push(compliance.batteryLabel);
  if (compliance.ipRisk) warnings.push(compliance.ipRiskLabel);

  // Section 301 warning
  if (section301Amount > 0) {
    warnings.push(ll(locale, 'warning_section301'));
  }

  // Suggested declaration description
  const declParts = [productName];
  if (material) declParts.push(ll(locale, 'suggested_decl')[0].replace('{0}', material));
  if (usage) declParts.push(ll(locale, 'suggested_decl')[1].replace('{0}', usage));
  const suggestedDeclaration = aiDeclaration ?? declParts.join('，').slice(0, 120);

  // Regulatory conditions warning
  if (dbItem?.conditions) {
    warnings.push(ll(locale, 'warning_conditions', dbItem.conditions));
  }

  // Landed cost (using tariff engine)
  const shipping = shippingEstimate ?? ENGINE_SHIPPING[originCountry] ?? 10;
  const landed = calculateLandedCost(declaredValue, shipping, usDuty, euDuty, euVat, quantity);

  // Suggested retail price
  const baseCost = declaredValue * quantity + shipping;
  const markupMultiplier = overallRisk === 'high' ? 2.5 : overallRisk === 'medium' ? 2.0 : 1.5;
  const suggestedPrice = Math.round((baseCost + usDuty + euDuty + euVat) * markupMultiplier * 100) / 100;

  // Shipment recommendation
  const hasChinaTariff = isChina && (section301Amount > 0 || usDuty > 10);
  const shipmentRecommended = !hasChinaTariff && !compliance.battery && !compliance.dangerous;
  const shipmentReason = hasChinaTariff
    ? ll(locale, 'shipment_reason_china')
    : compliance.battery || compliance.dangerous
      ? ll(locale, 'shipment_reason_battery')
      : ll(locale, 'shipment_reason_ok');

  // Platform fee calculation
  const pf = PLATFORM_FEES[platform] || PLATFORM_FEES.none;
  const platformFee = Math.round((suggestedPrice * pf.commissionRate + pf.fulfillmentFee * quantity) * 100) / 100;

  // Profit calculation
  const estimatedProfit = Math.round((suggestedPrice - landed.grandTotalUs - platformFee) * 100) / 100;
  const profitMargin = suggestedPrice > 0 ? Math.round((estimatedProfit / suggestedPrice) * 1000) / 10 : 0;
  const profitRecommendation: 'recommended' | 'caution' | 'not_recommended' =
    profitMargin > 30 ? 'recommended' : profitMargin > 15 ? 'caution' : 'not_recommended';

  const marginStr = `${profitMargin}%`;
  const profitReason = profitRecommendation === 'recommended'
    ? ll(locale, 'profit_recommended', marginStr)
    : profitRecommendation === 'caution'
      ? ll(locale, 'profit_caution', marginStr)
      : ll(locale, 'profit_not_recommended', marginStr);

  // Multi-country comparison using tariff engine
  const countryComparison = [
    { country: 'china', label: ll(locale, 'china') },
    { country: 'vietnam', label: ll(locale, 'vietnam') },
    { country: 'thailand', label: ll(locale, 'thailand') },
    { country: 'mexico', label: ll(locale, 'mexico') },
  ].map((c) => {
    const ship = shippingEstimate ?? ENGINE_SHIPPING[c.country] ?? 10;
    const cResult = lookupUsTariff(hsCode, c.country, declaredValue, quantity);
    const cUsDuty = cResult.totalDuty;
    const cTotal = Math.round((declaredValue * quantity + ship + cUsDuty) * 100) / 100;
    return { country: c.country, label: c.label, totalCost: cTotal, duty: cUsDuty };
  });
  const best = countryComparison.reduce((a, b) => a.totalCost < b.totalCost ? a : b);
  const bestOriginCountry = best.country;
  const bestOriginLabel = best.label;

  return {
    productName,
    material,
    usage,
    selectedHsCode: hsCode,
    hsDescription: aiHsDescription || dbItem?.description || ll(locale, 'hs_default'),
    us: {
      estimatedDuty: Math.round(usDuty * 100) / 100,
      dutyRate: usResult.rateDisplay,
      calculation: usResult.calculation,
      t86Impact,
      section301: Math.round(section301Amount * 100) / 100,
      section301Label: usResult.section301Label,
      riskLevel: usRisk,
    },
    eu: {
      estimatedDuty: Math.round(euDuty * 100) / 100,
      estimatedVat: Math.round(euVat * 100) / 100,
      totalEu: Math.round(totalEu * 100) / 100,
      dutyRate: euResult.dutyRate,
      vatRate: euResult.vatRate,
      riskLevel: euRisk,
    },
    landedCost: {
      declaredValue: landed.declaredValue,
      shippingEstimate: landed.shippingEstimate,
      usDuty: landed.usDuty,
      euDuty: landed.euDuty,
      euVat: landed.euVat,
      totalDuty: landed.totalDuty,
      grandTotalUs: landed.grandTotalUs,
      grandTotalEu: landed.grandTotalEu,
    },
    compliance,
    restricted,
    conditions: dbItem?.conditions ?? '',
    taxRebate: dbItem?.tax_rebate ?? null,
    suggestedPrice,
    shipmentRecommended,
    shipmentReason,
    platform: {
      name: platform,
      label: getPlatformLabel(platform, locale),
      commissionRate: pf.commissionRate,
      fulfillmentFee: pf.fulfillmentFee,
      totalFee: platformFee,
    },
    overallRisk,
    estimatedProfit,
    profitMargin,
    profitRecommendation,
    profitReason,
    countryComparison,
    bestOriginCountry,
    bestOriginLabel,
    suggestedDeclaration,
    dataSource: ll(locale, 'data_source'),
    dataUpdated: getLastUpdated(),
    warnings,
  };
}
