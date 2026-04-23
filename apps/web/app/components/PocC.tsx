'use client';
// POC C — 夜幕
// Visual thesis: 深色沉浸，近黑画布，rgba白光分层，薄荷绿点缀，专注无打扰
// Surface hierarchy: canvas #090c0f → cards rgba(255,255,255,0.04) → elevated rgba(255,255,255,0.07)
// Font: ui-monospace for amounts, system-ui for labels
// Accent: #34d399 (emerald / mint)

import { useState } from 'react';

const SAMPLE = [
  {
    id: '1',
    date: '2026-04-22',
    type: 'expense',
    icon: '🍜',
    category: '餐饮',
    amount: 38.5,
    note: '午饭',
  },
  {
    id: '2',
    date: '2026-04-22',
    type: 'expense',
    icon: '🚇',
    category: '交通',
    amount: 6,
    note: '',
  },
  {
    id: '3',
    date: '2026-04-22',
    type: 'income',
    icon: '💰',
    category: '薪资',
    amount: 12000,
    note: '四月工资',
  },
  {
    id: '4',
    date: '2026-04-21',
    type: 'expense',
    icon: '🛍️',
    category: '购物',
    amount: 299,
    note: 'T恤',
  },
  {
    id: '5',
    date: '2026-04-21',
    type: 'expense',
    icon: '☕',
    category: '餐饮',
    amount: 32,
    note: '下午茶',
  },
  {
    id: '6',
    date: '2026-04-20',
    type: 'expense',
    icon: '🏠',
    category: '住房',
    amount: 3500,
    note: '四月房租',
  },
  {
    id: '7',
    date: '2026-04-20',
    type: 'income',
    icon: '💵',
    category: '其他',
    amount: 500,
    note: '朋友还款',
  },
];

function groupByDate(items: typeof SAMPLE) {
  const map = new Map<string, typeof SAMPLE>();
  for (const t of items) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  return [...map.entries()];
}

const CANVAS = '#090c0f';
const CARD = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.90)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.40)';
const TEXT_MUTED = 'rgba(255,255,255,0.20)';
const MINT = '#34d399';
const RED = '#f87171';
const MONO = "ui-monospace, 'Cascadia Code', 'Fira Code', monospace";

export default function PocC() {
  const [search, setSearch] = useState('');
  const filtered = SAMPLE.filter(
    (t) => !search || t.note.includes(search) || t.category.includes(search)
  );
  const grouped = groupByDate(filtered);
  const totalIncome = SAMPLE.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = SAMPLE.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <div
      className="min-h-screen"
      style={{
        background: CANVAS,
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: `${CANVAS}e6`,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${CARD_BORDER}`,
        }}
      >
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4">
          {/* Title + add */}
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-xl font-bold"
              style={{ color: TEXT_PRIMARY, letterSpacing: '-0.022em' }}
            >
              记账本
            </h1>
            <button
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 hover:brightness-110"
              style={{ background: MINT, color: '#071a0f', touchAction: 'manipulation' }}
            >
              ＋ 记一笔
            </button>
          </div>

          {/* Summary card */}
          <div
            className="rounded-2xl p-4 mb-4 grid grid-cols-3 gap-4"
            style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
          >
            {[
              { label: '收入', value: totalIncome, sign: '+', color: MINT },
              { label: '支出', value: totalExpense, sign: '-', color: RED },
              {
                label: '结余',
                value: Math.abs(net),
                sign: net >= 0 ? '+' : '-',
                color: net >= 0 ? MINT : RED,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs mb-1" style={{ color: TEXT_MUTED }}>
                  {item.label}
                </p>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: MONO, color: item.color, letterSpacing: '-0.02em' }}
                >
                  {item.sign}¥{item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
          >
            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>🔍</span>
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="搜索…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: TEXT_PRIMARY }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ color: TEXT_MUTED, touchAction: 'manipulation' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
        {grouped.map(([date, items]) => {
          const dayNet = items.reduce(
            (s, t) => (t.type === 'expense' ? s - t.amount : s + t.amount),
            0
          );
          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: TEXT_MUTED }}
                >
                  {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ fontFamily: MONO, color: dayNet >= 0 ? MINT : RED }}
                >
                  {dayNet >= 0 ? '+' : ''}¥{dayNet.toLocaleString()}
                </span>
              </div>

              {/* Card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
              >
                {items.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3.5 group cursor-pointer transition-colors"
                    style={{
                      borderTop: i > 0 ? `1px solid ${CARD_BORDER}` : 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Accent bar */}
                    <div
                      className="w-0.5 h-7 rounded-full flex-shrink-0"
                      style={{ background: t.type === 'expense' ? RED : MINT, opacity: 0.7 }}
                    />
                    <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {t.category}
                      </p>
                      {t.note && (
                        <p className="text-xs truncate" style={{ color: TEXT_SECONDARY }}>
                          {t.note}
                        </p>
                      )}
                    </div>
                    <p
                      className="text-sm font-bold tabular-nums flex-shrink-0"
                      style={{
                        fontFamily: MONO,
                        color: t.type === 'expense' ? RED : MINT,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                    </p>
                    <button
                      aria-label="删除"
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded transition-opacity text-sm"
                      style={{ color: TEXT_MUTED, touchAction: 'manipulation' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = RED)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-3xl mb-3">🌑</p>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              没有找到相关记录
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
