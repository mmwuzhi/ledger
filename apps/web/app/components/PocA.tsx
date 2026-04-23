'use client';
// POC A — 暖账本
// Visual thesis: 手账质感，奶油白画布，Bitter 衬线数字，无卡片边框，赤陶点缀
// Font: Bitter (serif warmth for amounts), system-ui for chrome
// Accent: #b5693a (terracotta)

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

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d === today.toISOString().slice(0, 10)) return '今天';
  if (d === yesterday.toISOString().slice(0, 10)) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function PocA() {
  const [search, setSearch] = useState('');
  const filtered = SAMPLE.filter(
    (t) => !search || t.note.includes(search) || t.category.includes(search)
  );
  const grouped = groupByDate(filtered);
  const totalIncome = SAMPLE.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = SAMPLE.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: '#faf8f4', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-stone-100"
        style={{ boxShadow: '0 1px 0 #e8e2d9' }}
      >
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-800">记账本</h1>
            <button
              className="text-sm font-medium px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: '#b5693a', touchAction: 'manipulation' }}
            >
              ＋ 记一笔
            </button>
          </div>

          {/* Summary row */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: '#fdf3eb' }}>
              <p className="text-xs text-stone-400 mb-0.5">本月收入</p>
              <p
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Bitter', Georgia, serif", color: '#2d7a4f' }}
              >
                +¥{totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: '#fdf3eb' }}>
              <p className="text-xs text-stone-400 mb-0.5">本月支出</p>
              <p
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Bitter', Georgia, serif", color: '#b5402a' }}
              >
                -¥{totalExpense.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-stone-100">
            <span className="text-stone-300 text-sm">🔍</span>
            <input
              className="flex-1 bg-transparent text-sm text-stone-700 placeholder-stone-300 outline-none"
              placeholder="搜索备注或分类…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-5 py-4 space-y-6">
        {grouped.map(([date, items]) => {
          const dayExp = items
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0);
          const dayInc = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          return (
            <div key={date}>
              {/* Date header */}
              <div
                className="flex items-center justify-between mb-2 pb-1.5"
                style={{ borderBottom: '1px solid #e8e2d9' }}
              >
                <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
                  {formatDate(date)}
                </span>
                <span
                  className="text-xs text-stone-400"
                  style={{ fontFamily: "'Bitter', Georgia, serif" }}
                >
                  {dayExp > 0 && (
                    <span style={{ color: '#b5402a' }}>-¥{dayExp.toLocaleString()}</span>
                  )}
                  {dayExp > 0 && dayInc > 0 && ' · '}
                  {dayInc > 0 && (
                    <span style={{ color: '#2d7a4f' }}>+¥{dayInc.toLocaleString()}</span>
                  )}
                </span>
              </div>

              {/* Rows — no card box, just ink on paper */}
              <div className="space-y-0">
                {items.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-3 group cursor-pointer"
                    style={{
                      borderBottom: i < items.length - 1 ? '1px solid #f0ebe3' : 'none',
                    }}
                  >
                    {/* Color dot */}
                    <div
                      className="w-1.5 h-8 rounded-full flex-shrink-0"
                      style={{
                        background: t.type === 'expense' ? '#b5402a' : '#2d7a4f',
                        opacity: 0.6,
                      }}
                    />
                    <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">{t.category}</p>
                      {t.note && <p className="text-xs text-stone-400 truncate">{t.note}</p>}
                    </div>
                    <p
                      className="text-base font-semibold flex-shrink-0"
                      style={{
                        fontFamily: "'Bitter', Georgia, serif",
                        color: t.type === 'expense' ? '#b5402a' : '#2d7a4f',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                    </p>
                    <button
                      aria-label="删除"
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 ml-1 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                      style={{ touchAction: 'manipulation' }}
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
          <div className="text-center py-24 text-stone-300">
            <div className="text-4xl mb-3">📒</div>
            <p className="text-sm">没有找到相关记录</p>
          </div>
        )}
      </div>

      {/* Load Bitter font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&display=swap');`}</style>
    </div>
  );
}
