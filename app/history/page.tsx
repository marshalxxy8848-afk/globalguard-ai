'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HistoryRecord {
  id: string;
  productName: string;
  hsCode: string;
  riskLevel: string;
  report: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/history')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setRecords(data.records || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  const riskColor = (level: string) => {
    const colors: Record<string, string> = { low: 'text-green-400', medium: 'text-amber-400', high: 'text-red-400' };
    return colors[level] || 'text-white/40';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold gradient-text mb-6">Audit History</h1>

      {records.length === 0 ? (
        <p className="text-sm text-white/40">No audits yet. Upload a product on the home page.</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-medium">{r.productName}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    HS {r.hsCode} &middot; {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-medium ${riskColor(r.riskLevel)}`}>
                  {r.riskLevel.toUpperCase()}
                </span>
              </button>

              {expanded === r.id && (
                <div className="px-4 pb-4 text-xs text-white/40">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                    {JSON.stringify(JSON.parse(r.report), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
