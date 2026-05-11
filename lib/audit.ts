import { findByHsCode, type CategoryItem } from './hs-codes';

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
  overallRisk: 'low' | 'medium' | 'high';
  suggestedDeclaration: string;
  warnings: string[];
}

// US tariff assumptions (post-T86 scenario)
const US_FLAT_RATE = 25;       // $25/package
const US_AD_VALOREM = 0.30;    // 30% ad valorem
const EU_VAT_RATE = 0.20;      // 20% VAT

export function generateAuditReport(
  productName: string,
  material: string,
  usage: string,
  hsCode: string,
  declaredValue: number = 50, // default $50
  quantity: number = 1,
): AuditReport {
  const dbItem = findByHsCode(hsCode);
  const warnings: string[] = [];

  // US duty calculation
  const usAdValorem = declaredValue * quantity * US_AD_VALOREM;
  const usFlatRate = US_FLAT_RATE * quantity;
  const usDuty = Math.max(usAdValorem, usFlatRate);
  const usDutySource = usAdValorem >= usFlatRate ? '30% ad valorem' : '$25 fixed rate';

  // T86 impact assessment
  const t86Impact =
    usDuty > 0
      ? 'T86 de minimis ($800 exemption) likely revoked for Chinese-origin parcels. Each package now subject to duty.'
      : 'No immediate T86 impact.';

  // US risk level
  let usRisk: 'low' | 'medium' | 'high' = 'low';
  if (usDuty > 20) usRisk = 'high';
  else if (usDuty > 10) usRisk = 'medium';

  // EU duty calculation
  const euDutyRate = dbItem ? dbItem.base_tariff_eu / 100 : 0.05;
  const euDuty = declaredValue * quantity * euDutyRate;
  const euVat = (declaredValue * quantity + euDuty) * EU_VAT_RATE;
  const totalEu = euDuty + euVat;

  // EU risk level
  let euRisk: 'low' | 'medium' | 'high' = 'low';
  if (totalEu > 30) euRisk = 'high';
  else if (totalEu > 15) euRisk = 'medium';

  // Restricted item check
  const restricted = dbItem?.restricted || false;
  if (restricted) {
    warnings.push('This HS code category has special restrictions.');
  }

  // Overall risk
  const riskOrder = { low: 0, medium: 1, high: 2 };
  const overallScore = Math.max(riskOrder[usRisk], riskOrder[euRisk]);
  const overallRisk = (['low', 'medium', 'high'] as const)[overallScore];

  if (usRisk === 'high' || euRisk === 'high') {
    warnings.push('High tariff exposure detected — consider HS code optimization or origin-based strategies.');
  }

  // Suggested declaration description
  const suggestedDeclaration = [
    productName,
    material ? `made of ${material}` : '',
    `for ${usage}`,
  ]
    .filter(Boolean)
    .join(', ')
    .slice(0, 120);

  return {
    productName,
    material,
    usage,
    selectedHsCode: hsCode,
    hsDescription: dbItem?.description || 'General product category',
    us: {
      estimatedDuty: Math.round(usDuty * 100) / 100,
      dutyRate: `${(US_AD_VALOREM * 100).toFixed(0)}% or $${US_FLAT_RATE}/pc`,
      calculation: `$${declaredValue} × ${US_AD_VALOREM * 100}% = $${usAdValorem.toFixed(2)} vs $${US_FLAT_RATE}/pc flat → using ${usDutySource}`,
      t86Impact,
      riskLevel: usRisk,
    },
    eu: {
      estimatedDuty: Math.round(euDuty * 100) / 100,
      estimatedVat: Math.round(euVat * 100) / 100,
      totalEu: Math.round(totalEu * 100) / 100,
      dutyRate: `${(euDutyRate * 100).toFixed(1)}%`,
      vatRate: EU_VAT_RATE * 100,
      riskLevel: euRisk,
    },
    restricted,
    overallRisk,
    suggestedDeclaration,
    warnings,
  };
}
