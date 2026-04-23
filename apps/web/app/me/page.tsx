'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SETTINGS_KEYS, getBool, setBool } from '@/lib/settings';

// ── Design tokens ────────────────────────────────────────────────────────────

const TERRA = '#b5693a';
const CANVAS = '#f5f0e8';

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0 active:scale-95 transition-all"
      style={{ touchAction: 'manipulation' }}
      aria-checked={on}
      role="switch"
    >
      <div className="w-11 h-6 rounded-full transition-colors duration-200" style={{ background: on ? TERRA : '#d6cec4' }} />
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
        style={{ left: on ? '1.375rem' : '0.125rem' }}
      />
    </button>
  );
}

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  first?: boolean;
  last?: boolean;
}

function Row({ icon, label, sub, right, onClick, first, last }: RowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${onClick ? 'hover:bg-stone-50 active:scale-[0.99]' : ''}`}
      style={{
        borderTop: first ? 'none' : '1px solid #f7f4ef',
        borderRadius: first && last ? 24 : first ? '24px 24px 0 0' : last ? '0 0 24px 24px' : 0,
        touchAction: 'manipulation',
      }}
    >
      <span className="text-xl leading-none w-7 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700 leading-tight">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      {right ?? (onClick && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8bfb5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      ))}
    </Tag>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MePage() {
  const router = useRouter();

  const [hideIncome, setHideIncome] = useState(false);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [ocrAutoAttach, setOcrAutoAttach] = useState(true);

  // Load from localStorage on mount.
  // localStorage is client-only — useEffect is required here; disable the overzealous rule.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHideIncome(getBool(SETTINGS_KEYS.hideIncome, false));
    setMultiCurrency(getBool(SETTINGS_KEYS.multiCurrency, false));
    setOcrAutoAttach(getBool(SETTINGS_KEYS.ocrAutoAttach, true));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle(key: string, val: boolean, setter: (v: boolean) => void) {
    setter(val);
    setBool(key, val);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: CANVAS,
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-all"
          style={{ color: TERRA, touchAction: 'manipulation' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <span className="text-base font-semibold text-stone-700 tracking-tight">我的</span>
        <div style={{ width: 52 }} />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4 pb-12">

        {/* ── Profile card ── */}
        <SectionCard>
          <div className="flex items-center gap-4 px-5 py-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ background: TERRA }}
            >
              我
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-stone-800 leading-tight">MoneyBook 用户</p>
              <p className="text-xs text-stone-400 mt-0.5">个人账本</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Account settings ── */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2 px-1">账本设置</p>
          <SectionCard>
            <Row
              icon="🙈"
              label="隐藏收入"
              sub="账单列表和统计中不显示收入条目"
              right={<Toggle on={hideIncome} onChange={(v) => toggle(SETTINGS_KEYS.hideIncome, v, setHideIncome)} />}
              first
            />
            <Row
              icon="🏷️"
              label="分类管理"
              sub="添加、删除或修改分类图标"
              onClick={() => router.push('/me/categories')}
              last
            />
          </SectionCard>
        </div>

        {/* ── Currency ── */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2 px-1">货币</p>
          <SectionCard>
            <Row
              icon="💱"
              label="多币种记账"
              sub={multiCurrency ? '记账时可切换货币' : '开启后可在记账时切换货币'}
              right={<Toggle on={multiCurrency} onChange={(v) => toggle(SETTINGS_KEYS.multiCurrency, v, setMultiCurrency)} />}
              first
              last={!multiCurrency}
            />
            {multiCurrency && (
              <Row
                icon="🌐"
                label="管理货币列表"
                sub="选择需要的货币，汇率参考 (TODO)"
                onClick={() => router.push('/me/currencies')}
                last
              />
            )}
          </SectionCard>
        </div>

        {/* ── OCR / Receipts ── */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2 px-1">拍照识别</p>
          <SectionCard>
            <Row
              icon="📎"
              label="识别后自动添加附件"
              sub="OCR 完成后将原图自动附到记录"
              right={<Toggle on={ocrAutoAttach} onChange={(v) => toggle(SETTINGS_KEYS.ocrAutoAttach, v, setOcrAutoAttach)} />}
              first
              last
            />
          </SectionCard>
        </div>

        {/* ── About ── */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2 px-1">关于</p>
          <SectionCard>
            <Row icon="📒" label="MoneyBook" sub="记账本 v0.1.0" first last />
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
