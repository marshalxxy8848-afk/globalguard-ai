'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
);

export default function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'duplicate' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Detect user language from the page
  function detectLang(): string {
    if (typeof window === 'undefined') return 'zh-CN';
    try {
      const html = document.documentElement.lang;
      if (html) return html;
    } catch {}
    return navigator.language || 'zh-CN';
  }

  function validate(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const val = email.trim();
    if (!val || !validate(val)) {
      setErrorMsg('请输入有效邮箱');
      return;
    }

    setStatus('loading');

    try {
      const { error } = await supabase.from('subscribers').insert({
        email: val,
        lang: detectLang(),
      });

      if (error) {
        // code 23505 = duplicate key (unique constraint on email)
        if (error.code === '23505') {
          setStatus('duplicate');
        } else {
          console.error('[subscribe]', error);
          setErrorMsg('提交失败，请稍后重试');
          setStatus('error');
        }
        return;
      }

      setStatus('done');
    } catch (err) {
      console.error('[subscribe]', err);
      setErrorMsg('网络错误，请稍后重试');
      setStatus('error');
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
              disabled={status === 'loading'}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 shrink-0 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
            >
              {status === 'loading' ? '提交中...' : '免费订阅'}
            </button>
          </form>
          {errorMsg && <p className="mt-2 text-xs text-red-400">{errorMsg}</p>}
        </>
      )}
    </div>
  );
}
