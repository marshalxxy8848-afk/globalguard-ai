'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n';

interface User { id: string; email: string; }

export function Nav() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-white/5 px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
            <path d="M12 6v4m0 4v4" />
          </svg>
          <span className="font-semibold text-sm">GlobalGuard<span className="text-cyan-400">AI</span></span>
        </a>

        <nav className="flex items-center gap-3 ml-6 text-xs">
          <a href="/" className={`${pathname === '/' ? 'text-white/70' : 'text-white/30'} hover:text-white/60 transition-colors`}>
            {t('nav.audit')}
          </a>
          {user && (
            <a href="/history" className={`${pathname === '/history' ? 'text-white/70' : 'text-white/30'} hover:text-white/60 transition-colors`}>
              {t('nav.history')}
            </a>
          )}
        </nav>

        {/* Language toggle */}
        <div className="flex items-center gap-1.5 ml-auto text-xs">
          <button
            onClick={() => setLocale('zh-CN')}
            className={`px-2 py-1 rounded transition-colors ${locale === 'zh-CN' ? 'text-cyan-300 bg-cyan-500/10' : 'text-white/20 hover:text-white/40'}`}
          >
            中
          </button>
          <span className="text-white/10">/</span>
          <button
            onClick={() => setLocale('en-US')}
            className={`px-2 py-1 rounded transition-colors ${locale === 'en-US' ? 'text-cyan-300 bg-cyan-500/10' : 'text-white/20 hover:text-white/40'}`}
          >
            EN
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {user === 'loading' ? null : user ? (
            <>
              <span className="text-white/20">{user.email}</span>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="text-white/30 hover:text-white/60 transition-colors">{t('nav.login')}</a>
              <a href="/register" className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                {t('nav.signup')}
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
