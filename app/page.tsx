'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HistorySidebar from '@/app/components/HistorySidebar';
import { loadAudits, saveAudit, deleteAudit, clearAudits, toggleFavorite, getFavorites } from '@/lib/client-storage';
import type { StoredAudit } from '@/lib/client-storage';
import { useLocale } from '@/lib/i18n';
import { generateAuditReport } from '@/lib/audit';
import { EU_VAT_RATES } from '@/lib/eu-vat';

// --- Constants ---
const API_PATHS = { analyze: '/api/analyze-product' } as const;
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

type RiskLevel = 'low' | 'medium' | 'high';
type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

type SuggestedCode = { code: string; reason: string; confidence: number };

interface AuditReport {
  productName: string;
  material?: string;
  usage?: string;
  selectedHsCode: string;
  hsDescription: string;
  us: { estimatedDuty: number; dutyRate: string; calculation: string; t86Impact: string; riskLevel: RiskLevel };
  eu: { estimatedDuty: number; estimatedVat: number; totalEu: number; dutyRate: string; vatRate: number; riskLevel: RiskLevel };
  restricted: boolean;
  overallRisk: RiskLevel;
  suggestedDeclaration: string;
  warnings: string[];
}

const INVOICE_SHIPPER_KEY = 'globalguard_shipper';

interface ShipperInfo {
  name: string; address: string; city: string; country: string; phone: string;
}

function loadShipper(): ShipperInfo {
  if (typeof window === 'undefined') return { name: '', address: '', city: '', country: '', phone: '' };
  try {
    const raw = localStorage.getItem(INVOICE_SHIPPER_KEY);
    return raw ? JSON.parse(raw) : { name: '', address: '', city: '', country: '', phone: '' };
  } catch { return { name: '', address: '', city: '', country: '', phone: '' }; }
}

function saveShipper(info: ShipperInfo): void {
  try { localStorage.setItem(INVOICE_SHIPPER_KEY, JSON.stringify(info)); } catch { /* ignore */ }
}

// --- Commercial Invoice PDF (structured jsPDF for customs clearance) ---
async function downloadInvoice(report: AuditReport, originCountry: string, euCountryLabel: string) {
  const { default: jsPDF } = await import('jspdf');

  // Prompt for shipper/consignee info if not yet saved
  let shipper = loadShipper();
  if (!shipper.name) {
    shipper = { name: 'Your Company Name', address: '123 Export St', city: 'Shenzhen', country: 'China', phone: '+86-123-4567' };
    saveShipper(shipper);
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  const col2 = 100;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 150, 200);
  pdf.text('COMMERCIAL INVOICE', margin, 20);
  pdf.setDrawColor(0, 150, 200);
  pdf.line(margin, 23, pageW - margin, 23);

  // Invoice info
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  const invNo = `INV-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toISOString().split('T')[0];
  pdf.text(`Invoice No: ${invNo}`, margin, 32);
  pdf.text(`Date: ${today}`, margin, 38);

  // Shipper
  pdf.setFontSize(10);
  pdf.setTextColor(50);
  pdf.text('SHIPPER / EXPORTER', margin, 48);
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text([shipper.name, shipper.address, `${shipper.city}, ${shipper.country}`, shipper.phone], margin, 54);

  // Consignee
  pdf.setFontSize(10);
  pdf.setTextColor(50);
  pdf.text('CONSIGNEE', col2, 48);
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text(['Buyer Name', 'Buyer Address', 'Destination City, EU', 'Phone: +XX-XXX'], col2, 54);

  // Horizontal line
  pdf.setDrawColor(200);
  pdf.line(margin, 72, pageW - margin, 72);

  // Table header
  const y0 = 78;
  const cols = [
    { x: margin, w: 55, label: 'Description' },
    { x: margin + 55, w: 20, label: 'HS Code' },
    { x: margin + 75, w: 15, label: 'Qty' },
    { x: margin + 90, w: 25, label: 'Unit Value' },
    { x: margin + 115, w: 25, label: 'Total Value' },
    { x: margin + 140, w: 25, label: 'Origin' },
  ];

  pdf.setFontSize(8);
  pdf.setTextColor(50);
  pdf.setFillColor(240, 248, 255);
  cols.forEach((c) => { pdf.rect(c.x, y0, c.w, 7, 'F'); pdf.text(c.label, c.x + 1, y0 + 5); });

  // Table row
  const rowY = y0 + 7;
  pdf.setTextColor(80);
  pdf.setFontSize(9);
  pdf.text(report.productName.slice(0, 40), margin + 1, rowY + 4);
  pdf.setFontSize(8);
  pdf.text(report.selectedHsCode, margin + 56, rowY + 4);
  pdf.text('1', margin + 76, rowY + 4);
  pdf.text(`$50.00`, margin + 91, rowY + 4);
  pdf.text(`$50.00`, margin + 116, rowY + 4);
  const originLabel = originCountry === 'china' ? 'China' : originCountry === 'vietnam' ? 'Vietnam' : originCountry === 'thailand' ? 'Thailand' : 'Mexico';
  pdf.text(originLabel, margin + 141, rowY + 4);

  // Bottom border
  pdf.line(margin, rowY + 10, pageW - margin, rowY + 10);

  // Totals
  const totY = rowY + 18;
  pdf.setFontSize(9);
  pdf.setTextColor(50);
  pdf.text(`Subtotal:`, col2, totY);
  pdf.text(`$50.00`, col2 + 35, totY);
  pdf.text(`Estimated Duty:`, col2, totY + 6);
  pdf.text(`$${report.us.estimatedDuty.toFixed(2)} (US) / €${report.eu.estimatedDuty.toFixed(2)} (EU)`, col2 + 35, totY + 6);

  // Declaration
  const decY = totY + 14;
  pdf.setDrawColor(200);
  pdf.line(margin, decY, pageW - margin, decY);
  pdf.setFontSize(7);
  pdf.setTextColor(120);
  pdf.text('I declare that the above information is true and correct.', margin, decY + 6);
  pdf.text('This invoice is for customs purposes only.', margin, decY + 11);
  pdf.text(`HS Code: ${report.selectedHsCode} | Origin: ${originLabel} | EU Destination: ${euCountryLabel || 'N/A'}`, margin, decY + 16);

  // Signature
  pdf.text('Authorized Signature: ___________________', margin, decY + 26);
  pdf.text('Date: ___________________', margin, decY + 32);

  pdf.save(`invoice-${report.selectedHsCode}.pdf`);
}

// --- PDF export (html2canvas for reliable CJK rendering) ---
async function downloadPdf(report: AuditReport, locale: string, t: ReturnType<typeof useLocale>['t']) {
  const el = document.getElementById('audit-report-content');
  if (!el) return;
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0a0a0f', logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pdfW = 210;
    const pdfH = 297;
    const margin = 8;
    const imgW = pdfW - margin * 2;
    const imgH = (canvas.height / canvas.width) * imgW;
    let posY = margin;
    // If content is taller than one page, split across pages
    while (posY < imgH) {
      const remaining = imgH - posY;
      const pageH = pdfH - margin * 2;
      const srcY = (posY / imgH) * canvas.height;
      const srcH = Math.min((pageH / imgH) * canvas.height, canvas.height - srcY);
      // Crop canvas region for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;
      const ctx = pageCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      const pageImgData = pageCanvas.toDataURL('image/png');
      if (posY > margin) pdf.addPage();
      pdf.addImage(pageImgData, 'PNG', margin, margin, imgW, pageH);
      posY += pageH;
      pageCanvas.width = 0;
      pageCanvas.height = 0;
    }
    pdf.save(`globalguard-audit-${report.selectedHsCode}.pdf`);
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}

// --- Sub-components ---
function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useLocale();
  const colors = { low: 'bg-green-500/15 text-green-400', medium: 'bg-amber-500/15 text-amber-400', high: 'bg-red-500/15 text-red-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level]}`}>{t('risk.' + level)}</span>;
}

function Spinner({ size = 6 }: { size?: number }) {
  return <div className="rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
    style={{ width: `${size * 4}px`, height: `${size * 4}px` }} />;
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-cyan-400"
          style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }`}</style>
    </span>
  );
}

function Icon({ type }: { type: 'compass' | 'shield' | 'mic' }) {
  const paths: Record<string, string> = {
    compass: '<circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/><path d="M12 6v4m0 4v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  };
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    dangerouslySetInnerHTML={{ __html: paths[type] }} />;
}

function TariffCard({ label, currency, amount, riskLevel, lines }: {
  label: string; currency: string; amount: number; riskLevel: RiskLevel; lines: string[];
}) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Icon type="shield" />
        <span className="text-sm text-white/60">{label}</span>
        <RiskBadge level={riskLevel} />
      </div>
      <p className="text-2xl font-bold text-white/90">{currency}{amount.toFixed(2)}</p>
      {lines.map((line, i) => (
        <p key={i} className={`text-xs ${i === 0 ? 'text-white/30 mt-1' : 'text-white/20 mt-2 leading-relaxed'}`}>{line}</p>
      ))}
    </div>
  );
}

function AgenticCta({ risk, duty }: { risk: RiskLevel; duty: number }) {
  const { t } = useLocale();
  if (risk !== 'high') return null;
  return (
    <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 border border-blue-500/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Icon type="mic" /></div>
        <div>
          <h3 className="text-sm font-semibold text-blue-300">{t('agentic.title')}</h3>
          <p className="mt-2 text-sm text-blue-200/70 leading-relaxed">
            {t('agentic.desc_prefix')}<strong className="text-blue-200">${duty.toFixed(2)}{t('agentic.desc_suffix')}</strong>
          </p>
          <button className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors">
            {t('agentic.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Progress bar ---
function ProgressBar({ current, total }: { current: number; total: number }) {
  const { t } = useLocale();
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/40">{t('batch.progress')}</span>
        <span className="text-xs text-white/30">{current} / {total}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// --- HS Code editor sub-component ---
function HsCodeEditor({ code, suggestions, onChange }: {
  code: string; suggestions: SuggestedCode[]; onChange: (code: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function handleSelect(newCode: string) {
    onChange(newCode);
    setEditing(false);
  }

  function handleManualSubmit() {
    const cleaned = manualCode.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length === 6) { onChange(cleaned); setEditing(false); }
  }

  if (!editing) {
    return (
      <p>
        {t('report.hs_code')}:{' '}
        <button onClick={() => setEditing(true)} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer">
          {code} <span className="text-[10px] text-cyan-400/50">✎</span>
        </button>
      </p>
    );
  }

  return (
    <div className="relative">
      <p className="text-xs text-white/40 mb-2">{t('report.hs_code')}:</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {suggestions.map((s) => (
          <button key={s.code} onClick={() => handleSelect(s.code)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              s.code === code ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            {s.code}<br/><span className="text-[10px] opacity-60">{s.reason}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input ref={inputRef} type="text" placeholder="手动输入 6 位 HS 编码"
          value={manualCode} maxLength={6}
          onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-xs text-white/60 placeholder-white/20 outline-none focus:border-cyan-500/30"
        />
        <button onClick={handleManualSubmit} disabled={manualCode.length !== 6}
          className="px-3 py-1.5 rounded-lg text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500/20 transition-colors"
        >
          确定
        </button>
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/50 border border-transparent hover:border-white/10 transition-colors">
          取消
        </button>
      </div>
    </div>
  );
}

// --- Report display ---
function AuditReportView({ report, demoMode, demoReason, suggestedCodes, onHsCodeChange, isFav, onToggleFav, onDownloadInvoice }: {
  report: AuditReport; demoMode?: boolean; demoReason?: string;
  suggestedCodes?: SuggestedCode[]; onHsCodeChange?: (code: string) => void;
  isFav?: boolean; onToggleFav?: () => void; onDownloadInvoice?: () => void;
}) {
  const { t, locale } = useLocale();

  return (
    <div id="audit-report-content" className="mt-8 space-y-4">
      {/* Demo warning */}
      {demoMode && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-300">{t('report.demo_title')}</p>
              <p className="mt-1 text-xs text-amber-200/70 leading-relaxed">{demoReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Product info */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{report.productName}</h2>
            {onToggleFav && (
              <button onClick={onToggleFav} className="transition-colors" title={isFav ? '取消收藏' : '收藏'}>
                <svg className={`w-4 h-4 ${isFav ? 'text-amber-400' : 'text-white/20 hover:text-amber-400/50'}`} viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
          </div>
          <RiskBadge level={report.overallRisk} />
        </div>
        <div className="text-xs text-white/40 space-y-1">
          {onHsCodeChange && suggestedCodes ? (
            <HsCodeEditor code={report.selectedHsCode} suggestions={suggestedCodes} onChange={onHsCodeChange} />
          ) : (
            <p>{t('report.hs_code')}: <span className="text-white/60">{report.selectedHsCode}</span></p>
          )}
          <p>{t('report.description')}: <span className="text-white/60">{report.hsDescription}</span></p>
        </div>
      </div>

      {/* Tariff cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TariffCard label={t('report.us_tariff')} currency="$" amount={report.us.estimatedDuty}
          riskLevel={report.us.riskLevel} lines={[report.us.dutyRate, report.us.calculation, report.us.t86Impact]} />
        <TariffCard label={t('report.eu_tariff')} currency="€" amount={report.eu.totalEu}
          riskLevel={report.eu.riskLevel} lines={[`${t('pdf.rate')} ${report.eu.dutyRate} + VAT ${report.eu.vatRate}%`,
            `${t('pdf.estimated_duty')}: €${report.eu.estimatedDuty.toFixed(2)} | ${t('pdf.estimated_vat')}: €${report.eu.estimatedVat.toFixed(2)}`]} />
      </div>

      {/* Declaration */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{t('report.declaration_title')}</h3>
        <p className="text-sm text-white/70">&quot;{report.suggestedDeclaration}&quot;</p>
      </div>

      <AgenticCta risk={report.overallRisk} duty={report.us.estimatedDuty} />

      {/* Download buttons */}
      <div className="flex gap-3">
        <button onClick={async () => { await downloadPdf(report, locale, t); }}
          className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('report.download_pdf')}
        </button>
        {onDownloadInvoice && (
          <button onClick={onDownloadInvoice}
            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            下载商业发票
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main component ---
export default function Home() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [suggestedCodes, setSuggestedCodes] = useState<SuggestedCode[]>([]);
  const [error, setError] = useState('');
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoReason, setDemoReason] = useState('');
  const [declaredValue, setDeclaredValue] = useState(50);
  const [originCountry, setOriginCountry] = useState('china');
  const [euCountry, setEuCountry] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Batch state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [batchIndex, setBatchIndex] = useState(-1);
  const [batchResults, setBatchResults] = useState<AuditReport[]>([]);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // History state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<StoredAudit | null>(null);
  const [storedAudits, setStoredAudits] = useState<StoredAudit[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Load history + favorites from localStorage
  useEffect(() => {
    setStoredAudits(loadAudits());
    setFavorites(getFavorites());
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  // --- File selection ---
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;

    for (const f of arr) {
      if (!f.type.startsWith('image/')) { setError(t('error.not_image', { name: f.name })); return; }
      if (f.size > MAX_IMAGE_SIZE) { setError(t('error.too_large', { name: f.name })); return; }
    }
    if (arr.length > MAX_FILES) { setError(t('error.max_files', { max: MAX_FILES })); return; }

    setError('');
    setSelectedHistory(null);
    setReport(null);
    setDemoMode(false);
    setDemoReason('');

    const urls = arr.map((f) => URL.createObjectURL(f));
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = urls[0];

    setFiles(arr);
    setPreviews(urls);
    setBatchResults([]);
    setBatchIndex(-1);
    setBatchStatus('idle');
    setSinglePreview(urls[0]);
    setStatus('idle');

    // Single file: auto-analyze
    if (arr.length === 1) {
      const controller = new AbortController();
      abortRef.current = controller;
      const gen = ++generationRef.current;

      setStatus('analyzing');
      try {
        const base64 = await fileToBase64(arr[0]);
        if (gen !== generationRef.current) return;
        const result = await callApi(base64, controller.signal);
        if (gen !== generationRef.current) return;
        setReport(result.audit);
        setSuggestedCodes(result.suggestedHsCodes ?? []);
        setDemoMode(result.demoMode ?? false);
        setDemoReason(result.demoReason ?? '');
        setStatus('done');
        setBatchStatus('done');
        saveToLocal(result.audit, result.suggestedHsCodes);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : t('error.analysis_failed'));
        setStatus('error');
      }
    }
  }, [t]);

  // --- Start batch processing ---
  const startBatch = useCallback(async () => {
    if (files.length === 0) return;
    setError('');
    setSelectedHistory(null);
    setReport(null);
    setBatchIndex(0);
    const accumulated: AuditReport[] = [];

    const controller = new AbortController();
    abortRef.current = controller;
    const gen = ++generationRef.current;

    for (let i = 0; i < files.length; i++) {
      if (gen !== generationRef.current) return;
      setBatchIndex(i);
      setBatchStatus('processing');

      try {
        const base64 = await fileToBase64(files[i]);
        if (gen !== generationRef.current) return;
        const result = await callApi(base64, controller.signal);
        if (gen !== generationRef.current) return;

        accumulated.push(result.audit);
        setBatchResults(accumulated);
        setReport(result.audit);
        setSuggestedCodes(result.suggestedHsCodes ?? []);
        setDemoMode(result.demoMode ?? false);
        setDemoReason(result.demoReason ?? '');

        saveToLocal(result.audit, result.suggestedHsCodes);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : t('error.file_failed', { n: i + 1 }));
        setBatchStatus('idle');
        return;
      }
    }

    setStatus('done');
    setBatchStatus('done');
    setBatchIndex(-1);
  }, [files, t]);

  // --- Helpers ---
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return reject(new Error(t('error.read_failed')));
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function callApi(imageBase64: string, signal?: AbortSignal) {
    const res = await fetch(API_PATHS.analyze, {
      method: 'POST', headers: JSON_HEADERS,
      body: JSON.stringify({ image: imageBase64, declaredValue, originCountry, euCountry: euCountry || undefined }),
      signal,
    });
    if (!res.ok) throw new Error((await res.json()).error || t('error.analysis_failed'));
    return res.json();
  }

  function saveToLocal(audit: AuditReport, codes?: SuggestedCode[]) {
    const stored: StoredAudit = {
      id: crypto.randomUUID(),
      productName: audit.productName,
      hsCode: audit.selectedHsCode,
      riskLevel: audit.overallRisk,
      material: '',
      usage: '',
      report: audit,
      createdAt: new Date().toISOString(),
      suggestedHsCodes: codes,
    };
    saveAudit(stored);
    setStoredAudits(loadAudits());
    setFavorites(getFavorites());
  }

  // --- History handlers ---
  function handleSelectHistory(audit: StoredAudit) {
    setSelectedHistory(audit);
    setSuggestedCodes(audit.suggestedHsCodes ?? []);
    setSidebarOpen(false);
  }

  function handleDeleteHistory(id: string) {
    deleteAudit(id);
    setStoredAudits(loadAudits());
    if (selectedHistory?.id === id) setSelectedHistory(null);
  }

  function handleClearAll() {
    clearAudits();
    setStoredAudits([]);
    setSelectedHistory(null);
  }

  function handleBackToCurrent() {
    setSelectedHistory(null);
  }

  function handleHsCodeChange(newCode: string) {
    const current = selectedHistory ? (selectedHistory.report as AuditReport) : report;
    if (!current) return;
    const newReport = generateAuditReport(
      current.productName,
      current.material ?? '',
      current.usage ?? '',
      newCode,
      current.suggestedDeclaration,
      current.hsDescription,
      50, 1, originCountry, euCountry || undefined,
    );
    setReport(newReport);
    // Persist to localStorage if viewing history
    if (selectedHistory) {
      const updated: StoredAudit = { ...selectedHistory, hsCode: newCode, report: newReport };
      saveAudit(updated);
      setStoredAudits(loadAudits());
    }
  }

  // --- Drop handler ---
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (batchStatus === 'processing') return;
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles, batchStatus]);

  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);

  const isBusy = status === 'uploading' || status === 'analyzing';
  const currentReport = selectedHistory ? (selectedHistory.report as AuditReport) : report;
  const batchProgress = files.length > 0 && batchStatus === 'processing' && batchIndex >= 0
    ? { current: batchIndex + 1, total: files.length }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <HistorySidebar
        audits={[...storedAudits].sort((a, b) => {
          const aFav = favorites.includes(a.id) ? 0 : 1;
          const bFav = favorites.includes(b.id) ? 0 : 1;
          return aFav - bFav;
        })}
        selectedId={selectedHistory?.id ?? null}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        onClearAll={handleClearAll}
        favorites={favorites}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold gradient-text">{t('app.title')}</h1>
          <p className="mt-2 text-sm text-white/40">{t('app.subtitle')}</p>
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isBusy && batchStatus !== 'processing' && fileRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            isDragOver ? 'border-cyan-400 bg-cyan-500/[0.04]' :
            isBusy || batchStatus === 'processing' ? 'border-cyan-500/30 bg-cyan-500/[0.02]' :
            'border-white/10 hover:border-white/20 bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileRef} type="file" accept="image/*" multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {previews.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2 flex-wrap justify-center">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Product ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                    {batchStatus === 'processing' && i < batchIndex && (
                      <div className="absolute inset-0 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    {batchStatus === 'processing' && i === batchIndex && (
                      <div className="absolute inset-0 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Spinner size={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {batchStatus === 'idle' && (
                <p className="text-xs text-white/30">{t('upload.selected', { n: files.length })}</p>
              )}
            </div>
          ) : isBusy ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size={10} />
              <p className="text-sm text-white/60">{status === 'uploading' ? t('upload.busy_uploading') : t('upload.busy_analyzing')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-white/40"><span className="text-white/60">{t('upload.images')}</span> {t('upload.drag')}</p>
              <p className="text-xs text-white/20">{t('upload.hint', { max: MAX_FILES })}</p>
            </div>
          )}
        </div>

        {/* Declared value + Origin country + EU country inputs (visible when idle) */}
        {!isBusy && batchStatus !== 'processing' && (
          <div className="mt-4 grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[10px] text-white/30 block mb-1">申报价值 (USD)</label>
              <input type="number" min={1} max={9999} value={declaredValue}
                onChange={(e) => setDeclaredValue(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white/60 outline-none focus:border-cyan-500/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">原产国</label>
              <select value={originCountry} onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white/60 outline-none focus:border-cyan-500/30 appearance-none cursor-pointer"
              >
                <option value="china">中国</option>
                <option value="vietnam">越南</option>
                <option value="thailand">泰国</option>
                <option value="mexico">墨西哥</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">欧盟目的国（VAT）</label>
              <select value={euCountry} onChange={(e) => setEuCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white/60 outline-none focus:border-cyan-500/30 appearance-none cursor-pointer"
              >
                <option value="">不指定（默认 20%）</option>
                {Object.entries(EU_VAT_RATES).map(([code, { name, rate }]) => (
                  <option key={code} value={code}>{name} ({(rate * 100).toFixed(1)}%)</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

        {/* Batch start button */}
        {files.length > 0 && batchStatus === 'idle' && !isBusy && (
          <button
            onClick={startBatch}
            className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {t('batch.start', { n: files.length })}
          </button>
        )}

        {/* Progress bar during batch */}
        {batchProgress && (
          <div className="mt-6">
            <ProgressBar current={batchProgress.current} total={batchProgress.total} />
            <div className="mt-3 flex items-center gap-2 text-xs text-white/40 justify-center">
              <Spinner size={3} />
              {t('batch.analyzing', { current: batchProgress.current, total: batchProgress.total })}
            </div>
          </div>
        )}

        {/* AI agent loading animation */}
        {status === 'analyzing' && !currentReport && !error && !batchProgress && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 mb-4">
              <LoadingDots /> {t('loading.agents')}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6">
              {[
                { key: 'loading.vision', label: t('loading.vision') },
                { key: 'loading.retriever', label: t('loading.retriever') },
                { key: 'loading.auditor', label: t('loading.auditor') },
              ].map((agent) => (
                <div key={agent.key} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <Spinner size={5} />
                  <p className="mt-2 text-[10px] text-white/30">{agent.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch done message */}
        {batchStatus === 'done' && files.length > 1 && (
          <div className="mt-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400 text-center">
            {t('batch.complete', { n: batchResults.length })}
          </div>
        )}

        {/* Batch comparison view */}
        {batchStatus === 'done' && batchResults.length > 1 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">批量结果对比</h3>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 min-w-max pb-2">
                {batchResults.map((r, i) => (
                  <button key={i} onClick={() => setReport(r)}
                    className={`w-48 shrink-0 p-4 rounded-xl border text-left transition-colors ${
                      report === r ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs text-white/70 truncate mb-1" title={r.productName}>{r.productName}</p>
                    <p className="text-[10px] text-cyan-400/70 font-mono mb-2">{r.selectedHsCode}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        r.overallRisk === 'high' ? 'bg-red-500/15 text-red-400' :
                        r.overallRisk === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-green-500/15 text-green-400'
                      }`}>{r.overallRisk === 'high' ? '高' : r.overallRisk === 'medium' ? '中' : '低'}</span>
                    </div>
                    <div className="space-y-0.5 text-[10px] text-white/30">
                      <p>US: ${r.us.estimatedDuty.toFixed(2)}</p>
                      <p>EU: €{r.eu.totalEu.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Viewing history banner */}
        {selectedHistory && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="flex-1">{t('history.viewing', { name: selectedHistory.productName })}</span>
            <button onClick={handleBackToCurrent} className="text-cyan-300/60 hover:text-cyan-300 underline">
              {t('history.back')}
            </button>
          </div>
        )}

        {/* Report */}
        {currentReport && (
          <AuditReportView
            report={currentReport}
            demoMode={selectedHistory ? false : demoMode}
            demoReason={selectedHistory ? undefined : demoReason}
            suggestedCodes={suggestedCodes}
            onHsCodeChange={handleHsCodeChange}
            isFav={selectedHistory ? favorites.includes(selectedHistory.id) : false}
            onToggleFav={selectedHistory ? () => {
              const nowFav = toggleFavorite(selectedHistory.id);
              setFavorites(getFavorites());
            } : undefined}
            onDownloadInvoice={() => downloadInvoice(currentReport, originCountry, euCountry || 'EU')}
          />
        )}
      </main>
    </div>
  );
}
