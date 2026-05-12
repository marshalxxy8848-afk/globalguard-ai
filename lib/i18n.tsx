'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Locale = 'zh-CN' | 'en-US';
type Dict = Record<string, string>;

const ZH_CN: Dict = {
  // Page header
  'app.title': '跨境合规审计',
  'app.subtitle': '上传产品照片，AI 自动完成 HS 编码分类与关税分析',

  // Upload zone
  'upload.images': '上传图片',
  'upload.drag': '或拖拽到此处',
  'upload.hint': '支持 PNG、JPG，每张不超过 5MB，最多 {max} 张',
  'upload.selected': '已选择 {n} 张图片 · 点击或拖拽替换',
  'upload.busy_uploading': '正在上传图片...',
  'upload.busy_analyzing': 'AI 正在分析您的产品...',

  // Batch
  'batch.start': '开始批量分析（{n} 项）',
  'batch.progress': '批量处理进度',
  'batch.analyzing': '正在分析第 {current} 项，共 {total} 项...',
  'batch.complete': '✅ 批量分析完成 — 共分析 {n} 项产品，结果已保存至历史记录。',

  // Loading states
  'loading.agents': 'AI 智能体正在检索全球法规...',
  'loading.vision': '视觉识别',
  'loading.retriever': '规则检索',
  'loading.auditor': '合规审计',

  // Errors
  'error.not_image': '"{name}" 不是有效的图片文件',
  'error.too_large': '"{name}" 超过 5MB 限制',
  'error.max_files': '一次最多上传 {max} 张图片',
  'error.analysis_failed': '分析失败',
  'error.file_failed': '第 {n} 项处理失败',
  'error.read_failed': '文件读取失败',

  // History sidebar
  'sidebar.title': '审计历史',
  'sidebar.records': '{n} 条记录',
  'sidebar.empty': '暂无审计历史',
  'sidebar.empty_hint': '上传产品即可开始',
  'sidebar.clear_all': '清除所有记录',
  'sidebar.close': '收起历史',
  'sidebar.open': '展开历史',
  'sidebar.hs': 'HS {code}',
  'sidebar.delete': '删除',

  // Report area
  'report.demo_title': '演示模式',
  'report.hs_code': 'HS 编码',
  'report.description': '商品描述',
  'report.us_tariff': '美国关税',
  'report.eu_tariff': '欧盟关税 + VAT（增值税）',
  'report.declaration_title': '建议申报描述',
  'report.download_pdf': '下载 PDF 报告',

  // Agentic guidance (AI 申报建议)
  'agentic.title': 'AI 申报建议',
  'agentic.desc_prefix': '您的产品受 T86 小额豁免政策变更影响。预计每票关税成本增加：',
  'agentic.desc_suffix': '/票',
  'agentic.cta': '尝试 AI 申报助手 →',

  // Archived report banner
  'history.viewing': '正在查看历史记录：{name}',
  'history.back': '返回当前',

  // Nav
  'nav.audit': '审计',
  'nav.history': '历史',
  'nav.login': '登录',
  'nav.signup': '注册',
  'nav.logout': '退出登录',

  // PDF
  'pdf.title': 'GlobalGuard AI — 合规审计报告',
  'pdf.date': '日期',
  'pdf.product_summary': '产品摘要',
  'pdf.product': '产品',
  'pdf.hs_code': 'HS 编码',
  'pdf.description': '描述',
  'pdf.risk_level': '风险等级',
  'pdf.us_tariff': '美国关税评估',
  'pdf.estimated_duty': '预估关税',
  'pdf.rate': '税率',
  'pdf.risk': '风险',
  'pdf.t86_impact': 'T86 小额豁免政策影响',
  'pdf.eu_tariff': '欧盟关税 + VAT 评估',
  'pdf.estimated_vat': '预估 VAT（增值税）',
  'pdf.total': '合计',
  'pdf.declaration': '建议报关描述',
  'pdf.warnings': '风险提示',
  'pdf.footer': '由 GlobalGuard AI 生成 — 此为 AI 辅助评估结果，不构成法律文件。',

  // Risk level
  'risk.low': '低',
  'risk.medium': '中',
  'risk.high': '高',

  // Language toggle
  'lang.switch': '语言',
};

const EN_US: Dict = {
  'app.title': 'Cross-Border Compliance Audit',
  'app.subtitle': 'Upload product photos for AI-powered HS classification & tariff analysis',
  'upload.images': 'Upload images',
  'upload.drag': 'or drag & drop',
  'upload.hint': 'PNG, JPG up to 5MB each · up to {max} at once',
  'upload.selected': '{n} file{n,plural} selected · click or drop to replace',
  'upload.busy_uploading': 'Uploading image...',
  'upload.busy_analyzing': 'AI agents analyzing your product...',
  'batch.start': 'Batch Analyze {n} File{n,plural}',
  'batch.progress': 'Batch progress',
  'batch.analyzing': 'Analyzing file {current} of {total}...',
  'batch.complete': '✅ Batch complete — {n} product{n,plural} analyzed. Results saved to history.',
  'loading.agents': 'AI agents retrieving global regulations...',
  'loading.vision': 'Vision Classifier',
  'loading.retriever': 'Rule Retriever',
  'loading.auditor': 'Compliance Auditor',
  'error.not_image': '"{name}" is not a valid image',
  'error.too_large': '"{name}" exceeds 5MB',
  'error.max_files': 'Maximum {max} files at a time',
  'error.analysis_failed': 'Analysis failed',
  'error.file_failed': 'File {n} failed',
  'error.read_failed': 'Failed to read file',
  'sidebar.title': 'Audit History',
  'sidebar.records': '{n} records',
  'sidebar.empty': 'No audit history yet.',
  'sidebar.empty_hint': 'Upload a product to get started.',
  'sidebar.clear_all': 'Clear All',
  'sidebar.close': 'Close history',
  'sidebar.open': 'Open history',
  'sidebar.hs': 'HS {code}',
  'sidebar.delete': 'Delete',
  'report.demo_title': 'Demo Mode',
  'report.hs_code': 'HS Code',
  'report.description': 'Description',
  'report.us_tariff': 'US Tariff',
  'report.eu_tariff': 'EU Tariff + VAT',
  'report.declaration_title': 'Suggested Declaration',
  'report.download_pdf': 'Download PDF Report',
  'agentic.title': 'Agentic Guidance',
  'agentic.desc_prefix': 'Your product is affected by T86 policy changes. Estimated customs cost increase: ',
  'agentic.desc_suffix': '/shipment',
  'agentic.cta': 'Try AI Declaration Agent →',
  'history.viewing': 'Viewing archived report: {name}',
  'history.back': 'Back to current',
  'nav.audit': 'Audit',
  'nav.history': 'History',
  'nav.login': 'Log in',
  'nav.signup': 'Sign up',
  'nav.logout': 'Log out',
  'pdf.title': 'GlobalGuard AI — Compliance Audit Report',
  'pdf.date': 'Date',
  'pdf.product_summary': 'Product Summary',
  'pdf.product': 'Product',
  'pdf.hs_code': 'HS Code',
  'pdf.description': 'Description',
  'pdf.risk_level': 'Risk Level',
  'pdf.us_tariff': 'US Tariff Assessment',
  'pdf.estimated_duty': 'Estimated Duty',
  'pdf.rate': 'Rate',
  'pdf.risk': 'Risk',
  'pdf.t86_impact': 'T86 Impact',
  'pdf.eu_tariff': 'EU Tariff + VAT Assessment',
  'pdf.estimated_vat': 'Estimated VAT',
  'pdf.total': 'Total',
  'pdf.declaration': 'Suggested Customs Declaration',
  'pdf.warnings': 'Warnings',
  'pdf.footer': 'Generated by GlobalGuard AI — This is an AI-assisted assessment, not a legal document.',
  'risk.low': 'LOW',
  'risk.medium': 'MEDIUM',
  'risk.high': 'HIGH',
  'lang.switch': 'Language',
};

const DICTS: Record<Locale, Dict> = { 'zh-CN': ZH_CN, 'en-US': EN_US };

const STORAGE_KEY = 'globalguard_locale';

function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let str = DICTS[locale][key];
  if (str === undefined) {
    // fallback
    str = DICTS['en-US'][key] ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
    // Handle simple plural: {n,plural} — replace with n (ignore actual plural logic for now)
    str = str.replace(/\{(\w+),plural\}/g, (_, name) => String(vars[name] ?? ''));
  }
  return str;
}

// --- Context ---
interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleCtx = createContext<LocaleContextValue>({
  locale: 'zh-CN',
  setLocale: () => {},
  t: () => '',
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en-US' || saved === 'zh-CN') return saved;
    }
    return 'zh-CN';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const translate = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale],
  );

  return (
    <LocaleCtx.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleCtx);
}
