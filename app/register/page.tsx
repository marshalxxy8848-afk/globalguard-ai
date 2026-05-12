'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Registration failed');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-xl bg-white/[0.02] border border-white/10">
        <h1 className="text-lg font-semibold mb-1">Create Account</h1>
        <p className="text-xs text-white/40 mb-6">Free — no credit card required</p>

        <label className="text-xs text-white/40">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 mb-4 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/40" />

        <label className="text-xs text-white/40">Password (min 6 characters)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 mb-4 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-cyan-400/40" />

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="mt-4 text-xs text-white/30 text-center">
          Already have an account? <a href="/login" className="text-cyan-400 hover:underline">Log in</a>
        </p>
      </form>
    </div>
  );
}
