'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n';

interface User { id: string; email: string; }

export function Nav() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
            <path d="M12 6v4m0 4v4" />
          </svg>
          <span className="font-semibold text-sm">GlobalGuard<span className="text-cyan-400">AI</span></span>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-4 ml-4 text-xs">
          <a href="/" className={`${pathname === '/' ? 'text-white/70' : 'text-white/30'} hover:text-white/60 transition-colors`}>
            {t('nav.audit')}
          </a>
          {user && (
            <a href="/history" className={`${pathname === '/history' ? 'text-white/70' : 'text-white/30'} hover:text-white/60 transition-colors`}>
              {t('nav.history')}
            </a>
          )}
        </nav>

        {/* Desktop lang + auth */}
        <div className="hidden sm:flex items-center gap-3 ml-auto text-xs">
          <select value={locale} onChange={(e) => setLocale(e.target.value as any)}
            className="bg-transparent text-white/50 hover:text-white/70 transition-colors cursor-pointer outline-none text-xs py-1 max-w-[100px]">
            <option value="zh-CN" className="bg-[#12121a]">中文</option>
            <option value="en-US" className="bg-[#12121a]">EN</option>
            <option value="ja-JP" className="bg-[#12121a]">日本語</option>
            <option value="ko-KR" className="bg-[#12121a]">한국어</option>
            <option value="vi-VN" className="bg-[#12121a]">Tiếng Việt</option>
            <option value="th-TH" className="bg-[#12121a]">ไทย</option>
            <option value="es-ES" className="bg-[#12121a]">Español</option>
            <option value="pt-PT" className="bg-[#12121a]">Português</option>
            <option value="fr-FR" className="bg-[#12121a]">Français</option>
            <option value="de-DE" className="bg-[#12121a]">Deutsch</option>
            <option value="ru-RU" className="bg-[#12121a]">Русский</option>
            <option value="id-ID" className="bg-[#12121a]">Bahasa Indonesia</option>
            <option value="ms-MY" className="bg-[#12121a]">Bahasa Melayu</option>
          </select>
          <div className="flex items-center gap-3">
            {user === 'loading' ? null : user ? (
              <><span className="text-white/20 truncate max-w-24">{user.email}</span><button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors">{t('nav.logout')}</button></>
            ) : (
              <><a href="/login" className="text-white/30 hover:text-white/60 transition-colors">{t('nav.login')}</a><a href="/register" className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors">{t('nav.signup')}</a></>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)}
          onPointerDown={() => setMenuOpen(m => !m)}
          onTouchStart={() => setMenuOpen(m => !m)}
          className="sm:hidden ml-auto p-2 text-white/40 hover:text-white/70 cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <><path d="M4 6h16M4 12h16M4 18h16" /></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-3 text-sm">
          <a href="/" className={`${pathname === '/' ? 'text-cyan-300' : 'text-white/50'} py-2`}>{t('nav.audit')}</a>
          {user && <a href="/history" className={`${pathname === '/history' ? 'text-cyan-300' : 'text-white/50'} py-2`}>{t('nav.history')}</a>}
          <div className="flex flex-wrap items-center gap-2 py-2 border-t border-white/5 pt-3">
            {[
              { id: 'zh-CN', label: '中文' },
              { id: 'en-US', label: 'EN' },
              { id: 'ja-JP', label: '日本語' },
              { id: 'ko-KR', label: '한국어' },
              { id: 'vi-VN', label: 'Tiếng Việt' },
              { id: 'th-TH', label: 'ไทย' },
              { id: 'es-ES', label: 'Español' },
              { id: 'pt-PT', label: 'Português' },
              { id: 'fr-FR', label: 'Français' },
              { id: 'de-DE', label: 'Deutsch' },
              { id: 'ru-RU', label: 'Русский' },
              { id: 'id-ID', label: 'Indonesia' },
              { id: 'ms-MY', label: 'Melayu' },
            ].map((lang) => (
              <button key={lang.id} onClick={() => setLocale(lang.id as any)}
                className={`px-2 py-1 rounded text-xs transition-colors ${locale === lang.id ? 'text-cyan-300 bg-cyan-500/10' : 'text-white/30 hover:text-white/50'}`}>
                {lang.label}
              </button>
            ))}
          </div>
          <div className="border-t border-white/5 pt-3">
            {user === 'loading' ? null : user ? (
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs truncate">{user.email}</span>
                <button onClick={handleLogout} className="px-3 py-1.5 rounded text-white/40 hover:text-white/70">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <a href="/login" className="flex-1 text-center py-2 rounded border border-white/10 text-white/50">{t('nav.login')}</a>
                <a href="/register" className="flex-1 text-center py-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">{t('nav.signup')}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
