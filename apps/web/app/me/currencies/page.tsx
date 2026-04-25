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
  { code: 'CNY', symbol: '¥',   name: '人民币',          flag: '🇨🇳' },
  { code: 'JPY', symbol: '¥',   name: '日元',            flag: '🇯🇵' },
  { code: 'USD', symbol: '$',   name: '美元',            flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',   name: '欧元',            flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   name: '英镑',            flag: '🇬🇧' },
  { code: 'HKD', symbol: 'HK$', name: '港币',            flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: '新台币',          flag: '🇹🇼' },
  { code: 'KRW', symbol: '₩',   name: '韩元',            flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$',  name: '新加坡元',        flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$',  name: '澳大利亚元',      flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$',  name: '加拿大元',        flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr',  name: '瑞士法郎',        flag: '🇨🇭' },
  { code: 'THB', symbol: '฿',   name: '泰铢',            flag: '🇹🇭' },
  { code: 'MYR', symbol: 'RM',  name: '马来西亚林吉特',  flag: '🇲🇾' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function persist(enabled: Set<string>, defaultCode: string) {
  const saved = CURRENCY_CATALOGUE
    .filter((c) => enabled.has(c.code))
    .map(({ code, symbol }) => ({ code, symbol }));
  localStorage.setItem(SETTINGS_KEYS.currencies, JSON.stringify(saved));
  localStorage.setItem(SETTINGS_KEYS.defaultCurrency, defaultCode);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CurrenciesPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(['CNY']));
  const [defaultCode, setDefaultCode] = useState('CNY');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEYS.currencies);
      if (stored) {
        const parsed: { code: string }[] = JSON.parse(stored);
        if (parsed.length > 0) setEnabled(new Set(parsed.map((c) => c.code)));
      }
      const def = localStorage.getItem(SETTINGS_KEYS.defaultCurrency);
      if (def) setDefaultCode(def);
    } catch {
      // ignore
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle(code: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        // Can't disable the default currency
        if (code === defaultCode) return prev;
        next.delete(code);
      } else {
        next.add(code);
      }
      persist(next, defaultCode);
      return next;
    });
  }

  function setDefault(code: string) {
    // Enabling a currency automatically when setting it as default
    setEnabled((prev) => {
      const next = new Set(prev);
      next.add(code);
      setDefaultCode(code);
      persist(next, code);
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
          勾选启用，记账时可切换。点击 ★ 设为默认货币。
        </p>

        {/* Currency list */}
        <div className="mx-4 rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
          {CURRENCY_CATALOGUE.map((cur, i) => {
            const isOn = enabled.has(cur.code);
            const isDefault = cur.code === defaultCode;
            return (
              <div
                key={cur.code}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderTop: i > 0 ? '1px solid #f5f0e8' : 'none' }}
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

                {/* Set-default star */}
                <button
                  onClick={() => setDefault(cur.code)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 flex-shrink-0"
                  style={{
                    color: isDefault ? '#f59e0b' : '#d6d3d1',
                    background: isDefault ? '#fef3c7' : 'transparent',
                    touchAction: 'manipulation',
                  }}
                  aria-label={isDefault ? '默认货币' : '设为默认'}
                >
                  {isDefault ? '★' : '☆'}
                </button>

                {/* Toggle */}
                <button
                  onClick={() => toggle(cur.code)}
                  disabled={isDefault}
                  className="flex-shrink-0 transition-all active:scale-95"
                  style={{ touchAction: 'manipulation', cursor: isDefault ? 'default' : 'pointer' }}
                  aria-label={isOn ? '已启用' : '已禁用'}
                >
                  <div
                    className="w-10 h-6 rounded-full flex items-center transition-colors duration-200"
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
                </button>
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
