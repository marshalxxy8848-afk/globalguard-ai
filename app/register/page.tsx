'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validate(): string | null {
    if (!email.includes('@') || !email.includes('.')) return '请输入有效的邮箱地址';
    if (password.length < 6) return '密码至少 6 位';
    if (password !== confirmPwd) return '两次输入的密码不一致';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error === 'Email already registered' ? '该邮箱已注册' : (data.error || '注册失败'));
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 mb-4">
            <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white/90">创建账号</h1>
          <p className="mt-1 text-xs text-white/40">免费注册，无需信用卡</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
          <label className="text-xs text-white/40">邮箱</label>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="your@email.com"
            className="mt-1 mb-4 w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 transition-colors"
          />

          <label className="text-xs text-white/40">密码（至少 6 位）</label>
          <div className="relative mt-1 mb-4">
            <input type={showPwd ? 'text' : 'password'} value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="至少 6 位"
              className="w-full px-3 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 transition-colors"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
            >
              {showPwd ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <label className="text-xs text-white/40">确认密码</label>
          <div className="relative mt-1 mb-4">
            <input type={showConfirm ? 'text' : 'password'} value={confirmPwd}
              onChange={(e) => { setConfirmPwd(e.target.value); setError(''); }}
              placeholder="再次输入密码"
              className="w-full px-3 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 transition-colors"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
            >
              {showConfirm ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-300/30 border-t-cyan-300 animate-spin" />
            )}
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="mt-4 text-xs text-white/30 text-center">
            已有账号？<a href="/login" className="text-cyan-400 hover:underline">登录</a>
          </p>
        </form>
      </div>
    </div>
  );
}
