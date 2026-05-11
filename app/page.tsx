'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// --- Constants ---
const API_PATHS = { analyze: '/api/analyze-product' } as const;
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const AGENT_LABELS = ['Vision Classifier', 'Rule Retriever', 'Compliance Auditor'] as const;

type RiskLevel = 'low' | 'medium' | 'high';
type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

interface AuditReport {
  productName: string;
  selectedHsCode: string;
  hsDescription: string;
  us: { estimatedDuty: number; dutyRate: string; calculation: string; t86Impact: string; riskLevel: RiskLevel };
  eu: { estimatedDuty: number; estimatedVat: number; totalEu: number; dutyRate: string; vatRate: number; riskLevel: RiskLevel };
  restricted: boolean;
  overallRisk: RiskLevel;
  suggestedDeclaration: string;
  warnings: string[];
}

// --- Sub-components ---

function RiskBadge({ level }: { level: RiskLevel }) {
  const colors = {
    low: 'bg-green-500/15 text-green-400',
    medium: 'bg-amber-500/15 text-amber-400',
    high: 'bg-red-500/15 text-red-400',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level]}`}>{level.toUpperCase()}</span>;
}

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className={`rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-cyan-400"
          style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }`}</style>
    </span>
  );
}

function Icon({ type }: { type: 'compass' | 'shield' | 'mic' }) {
  const paths: Record<string, string> = {
    compass:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/><path d="M12 6v4m0 4v4"/>',
    shield:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    mic:
      '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  };
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      dangerouslySetInnerHTML={{ __html: paths[type] }} />
  );
}

function TariffCard({
  label,
  currency,
  amount,
  riskLevel,
  lines,
}: {
  label: string;
  currency: string;
  amount: number;
  riskLevel: RiskLevel;
  lines: string[];
}) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Icon type="shield" />
        <span className="text-sm text-white/60">{label}</span>
        <RiskBadge level={riskLevel} />
      </div>
      <p className="text-2xl font-bold text-white/90">
        {currency}{amount.toFixed(2)}
      </p>
      {lines.map((line, i) => (
        <p key={i} className={`text-xs ${i === 0 ? 'text-white/30 mt-1' : 'text-white/20 mt-2 leading-relaxed'}`}>
          {line}
        </p>
      ))}
    </div>
  );
}

function AgenticCta({ risk, duty }: { risk: RiskLevel; duty: number }) {
  if (risk !== 'high') return null;
  return (
    <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 border border-blue-500/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Icon type="mic" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-300">Agentic Guidance</h3>
          <p className="mt-2 text-sm text-blue-200/70 leading-relaxed">
            Your product is affected by T86 policy changes. Estimated customs cost increase: <strong className="text-blue-200">${duty.toFixed(2)}/shipment</strong>.
            Click below to see how our AI declaration agent can save you 15% via the 9610 consolidation model.
          </p>
          <button className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors">
            Try AI Declaration Agent →
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main component ---

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be under 5MB');
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const gen = ++generationRef.current;
    setError('');
    setReport(null);
    setStatus('uploading');

    // Revoke previous preview
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreview(url);

    // Read file as base64
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        if (typeof reader.result !== 'string') return reject(new Error('Failed to read file'));
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    if (gen !== generationRef.current) return; // stale, a newer upload happened
    setStatus('analyzing');

    try {
      const res = await fetch(API_PATHS.analyze, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed');
      const data = await res.json();

      if (gen !== generationRef.current) return;
      setReport(data.audit);
      setStatus('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const isBusy = status === 'uploading' || status === 'analyzing';
  const showIdle = status === 'idle' || (status === 'error' && !preview);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Icon type="compass" />
          <span className="font-semibold text-sm">GlobalGuard<span className="text-cyan-400">AI</span></span>
          <span className="ml-auto text-[10px] text-white/20">Compliance Audit Terminal</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold gradient-text">Cross-Border Compliance Audit</h1>
          <p className="mt-2 text-sm text-white/40">Upload a product photo for AI-powered HS classification & tariff analysis</p>
        </div>

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isBusy && fileRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            isBusy
              ? 'border-cyan-500/30 bg-cyan-500/[0.02]'
              : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            {isBusy ? (
              <>
                <Spinner size={10} />
                <p className="text-sm text-white/60">
                  {status === 'uploading' ? 'Uploading image...' : 'AI agents analyzing your product...'}
                </p>
              </>
            ) : preview ? (
              <>
                <img src={preview} alt="Preview" className="max-h-40 rounded-lg" />
                <p className="text-xs text-white/30">Click or drop to replace</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={1.5}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm text-white/40"><span className="text-white/60">Upload image</span> or drag & drop</p>
                <p className="text-xs text-white/20">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {status === 'analyzing' && !report && !error && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 mb-4">
              <LoadingDots />
              AI agents retrieving global regulations...
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6">
              {AGENT_LABELS.map((agent) => (
                <div key={agent} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <Spinner size={5} />
                  <p className="mt-2 text-[10px] text-white/30">{agent}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="mt-8 space-y-4">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">{report.productName}</h2>
                <RiskBadge level={report.overallRisk} />
              </div>
              <div className="text-xs text-white/40 space-y-1">
                <p>HS Code: <span className="text-white/60">{report.selectedHsCode}</span></p>
                <p>Description: <span className="text-white/60">{report.hsDescription}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TariffCard
                label="US Tariff"
                currency="$"
                amount={report.us.estimatedDuty}
                riskLevel={report.us.riskLevel}
                lines={[report.us.dutyRate, report.us.calculation, report.us.t86Impact]}
              />
              <TariffCard
                label="EU Tariff + VAT"
                currency="€"
                amount={report.eu.totalEu}
                riskLevel={report.eu.riskLevel}
                lines={[
                  `Duty ${report.eu.dutyRate} + VAT ${report.eu.vatRate}%`,
                  `Duty: €${report.eu.estimatedDuty.toFixed(2)} | VAT: €${report.eu.estimatedVat.toFixed(2)}`,
                ]}
              />
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Suggested Declaration</h3>
              <p className="text-sm text-white/70">&quot;{report.suggestedDeclaration}&quot;</p>
            </div>

            <AgenticCta risk={report.overallRisk} duty={report.us.estimatedDuty} />
          </div>
        )}
      </main>
    </div>
  );
}
