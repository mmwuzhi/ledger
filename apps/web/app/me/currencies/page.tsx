'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SETTINGS_KEYS } from '@/lib/settings';

// ── Design tokens ─────────────────────────────────────────────────────────────

const TERRA = '#b5693a';
const CANVAS = '#f5f0e8';

// ── Currency catalogue ────────────────────────────────────────────────────────

type Currency = { code: string; symbol: string; name: string; flag: string };

const CURRENCY_CATALOGUE: Currency[] = [
  { code: 'CNY', symbol: '¥',  name: '人民币',      flag: '🇨🇳' },
  { code: 'USD', symbol: '$',  name: '美元',        flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  name: '欧元',        flag: '🇪🇺' },
  { code: 'JPY', symbol: '¥',  name: '日元',        flag: '🇯🇵' },
  { code: 'GBP', symbol: '£',  name: '英镑',        flag: '🇬🇧' },
  { code: 'HKD', symbol: 'HK$', name: '港币',       flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: '新台币',     flag: '🇹🇼' },
  { code: 'KRW', symbol: '₩',  name: '韩元',        flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$', name: '新加坡元',    flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$', name: '澳大利亚元',  flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: '加拿大元',    flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', name: '瑞士法郎',    flag: '🇨🇭' },
  { code: 'THB', symbol: '฿',  name: '泰铢',        flag: '🇹🇭' },
  { code: 'MYR', symbol: 'RM', name: '马来西亚林吉特', flag: '🇲🇾' },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CurrenciesPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(['CNY']));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEYS.currencies);
      if (stored) {
        const parsed: { code: string }[] = JSON.parse(stored);
        setEnabled(new Set(parsed.map((c) => c.code)));
      }
    } catch {
      // ignore
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle(code: string) {
    // CNY cannot be removed (it's the base currency)
    if (code === 'CNY') return;
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      // Persist: save { code, symbol } pairs in catalogue order
      const saved = CURRENCY_CATALOGUE.filter((c) => next.has(c.code)).map(({ code: c, symbol }) => ({ code: c, symbol }));
      localStorage.setItem(SETTINGS_KEYS.currencies, JSON.stringify(saved));
      return next;
    });
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: CANVAS, fontFamily: 'system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}
    >
      <div className="flex flex-col min-h-screen" style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <button
            onClick={() => router.push('/me')}
            className="flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-all"
            style={{ color: TERRA, touchAction: 'manipulation' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-base font-semibold text-stone-700 tracking-tight">货币管理</span>
          <div style={{ width: 36 }} />
        </div>

        <p className="text-xs text-stone-400 px-5 pb-3">
          勾选后，记账时可切换货币。人民币（CNY）始终启用。
        </p>

        {/* Currency list */}
        <div className="mx-4 rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          {CURRENCY_CATALOGUE.map((cur, i) => {
            const isOn = enabled.has(cur.code);
            const isLocked = cur.code === 'CNY';
            return (
              <button
                key={cur.code}
                onClick={() => toggle(cur.code)}
                disabled={isLocked}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-stone-50"
                style={{
                  borderTop: i > 0 ? '1px solid #f5f0e8' : 'none',
                  cursor: isLocked ? 'default' : 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {/* Flag */}
                <span className="text-2xl leading-none flex-shrink-0">{cur.flag}</span>

                {/* Name + code */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700">{cur.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {cur.code} · {cur.symbol}
                  </p>
                </div>

                {/* Toggle indicator */}
                {isLocked ? (
                  <span className="text-xs text-stone-300 flex-shrink-0">默认</span>
                ) : (
                  <div
                    className="w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-200 flex items-center"
                    style={{ background: isOn ? TERRA : '#e7e5e4', padding: '0 3px' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white transition-transform duration-200"
                      style={{
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        transform: isOn ? 'translateX(16px)' : 'translateX(0)',
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
