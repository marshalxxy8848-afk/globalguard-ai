'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'subscribers';

interface Subscriber {
  email: string;
  timestamp: string;
}

function getSubscribers(): Subscriber[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSubscriber(email: string): boolean {
  const list = getSubscribers();
  if (list.some((s) => s.email === email)) return false; // already exists
  list.push({ email, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

export default function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'done' | 'duplicate' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function validate(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('请输入有效邮箱');
      return;
    }
    if (!validate(email.trim())) {
      setErrorMsg('请输入有效邮箱');
      return;
    }

    const saved = saveSubscriber(email.trim());
    if (!saved) {
      setStatus('duplicate');
    } else {
      setStatus('done');
    }
  }

  if (!mounted) return null;

  return (
    <div className="mt-8 py-8 px-6 rounded-2xl border border-white/10 text-center" style={{ backgroundColor: '#13131a' }}>
      {status === 'done' ? (
        <p className="text-sm text-emerald-400">&#10003; 感谢订阅！首份报告将发送到你的邮箱</p>
      ) : status === 'duplicate' ? (
        <p className="text-sm text-amber-400">你已经订阅过了 &#128522;</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-white">获取每周关税政策更新</h3>
          <p className="text-sm text-white/60 mt-1">
            加入 500+ 跨境卖家，每周免费获取最新 HS 编码变动提醒
          </p>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
              placeholder="输入你的邮箱"
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-colors ${
                errorMsg
                  ? 'border border-red-500 bg-white/5'
                  : 'border border-white/20 bg-white/5 focus:border-cyan-500/50'
              }`}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
            >
              免费订阅
            </button>
          </form>
          {errorMsg && <p className="mt-2 text-xs text-red-400">{errorMsg}</p>}
        </>
      )}
    </div>
  );
}
