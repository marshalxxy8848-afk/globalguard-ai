// EU member state VAT rates (standard rates, as of 2025)
export const EU_VAT_RATES: Record<string, { name: string; rate: number }> = {
  at: { name: '奥地利', rate: 0.20 },
  be: { name: '比利时', rate: 0.21 },
  bg: { name: '保加利亚', rate: 0.20 },
  hr: { name: '克罗地亚', rate: 0.25 },
  cy: { name: '塞浦路斯', rate: 0.19 },
  cz: { name: '捷克', rate: 0.21 },
  dk: { name: '丹麦', rate: 0.25 },
  ee: { name: '爱沙尼亚', rate: 0.22 },
  fi: { name: '芬兰', rate: 0.255 },
  fr: { name: '法国', rate: 0.20 },
  de: { name: '德国', rate: 0.19 },
  gr: { name: '希腊', rate: 0.24 },
  hu: { name: '匈牙利', rate: 0.27 },
  ie: { name: '爱尔兰', rate: 0.23 },
  it: { name: '意大利', rate: 0.22 },
  lv: { name: '拉脱维亚', rate: 0.21 },
  lt: { name: '立陶宛', rate: 0.21 },
  lu: { name: '卢森堡', rate: 0.17 },
  mt: { name: '马耳他', rate: 0.18 },
  nl: { name: '荷兰', rate: 0.21 },
  pl: { name: '波兰', rate: 0.23 },
  pt: { name: '葡萄牙', rate: 0.23 },
  ro: { name: '罗马尼亚', rate: 0.19 },
  sk: { name: '斯洛伐克', rate: 0.23 },
  si: { name: '斯洛文尼亚', rate: 0.22 },
  es: { name: '西班牙', rate: 0.21 },
  se: { name: '瑞典', rate: 0.25 },
};

// Default VAT rate when no specific country is selected
export const DEFAULT_EU_VAT_RATE = 0.20;

// List of EU country codes (for dropdown)
export const EU_COUNTRY_CODES = Object.keys(EU_VAT_RATES);

export function getEuVatRate(countryCode?: string): number {
  if (!countryCode) return DEFAULT_EU_VAT_RATE;
  const entry = EU_VAT_RATES[countryCode.toLowerCase()];
  return entry?.rate ?? DEFAULT_EU_VAT_RATE;
}

export function getEuCountryName(countryCode?: string): string {
  if (!countryCode) return '';
  return EU_VAT_RATES[countryCode.toLowerCase()]?.name ?? '';
}
