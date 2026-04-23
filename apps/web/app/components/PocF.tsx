'use client';
// POC F — 侧栏总览
// Visual thesis: 左侧固定侧栏显示月份摘要 + 快捷操作，右侧滚动账单列表——最有"桌面端 Web App"感
// Difference from A/D/E: two-column layout, sticky left panel, scrollable right list
// Font: Nunito (amounts), system-ui (labels)
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
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (d === todayStr) return '今天';
  if (d === yesterdayStr) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const NUNITO = "'Nunito', 'Helvetica Neue', sans-serif";
const TERRA = '#b5693a';
const GREEN = '#2d7a4f';
const RED = '#b5402a';

export default function PocF() {
  const [search, setSearch] = useState('');
  const filtered = SAMPLE.filter(
    (t) => !search || t.note.includes(search) || t.category.includes(search)
  );
  const grouped = groupByDate(filtered);
  const totalIncome = SAMPLE.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = SAMPLE.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  // Category breakdown for sidebar
  const catMap = new Map<string, number>();
  SAMPLE.filter((t) => t.type === 'expense').forEach((t) => {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
  });
  const topCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: '#faf8f4',
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      {/* ── Left sidebar ── */}
      <div
        className="w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto flex flex-col"
        style={{ background: '#fff', borderRight: '1px solid #e8e2d8' }}
      >
        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* App name */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xl">📒</span>
            <span className="font-semibold text-stone-800 text-base tracking-tight">记账本</span>
          </div>

          {/* Month label */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
              2026年4月
            </p>

            {/* Net balance */}
            <p className="text-xs text-stone-400 mb-0.5">本月结余</p>
            <p
              className="font-extrabold tabular-nums leading-none mb-4"
              style={{
                fontFamily: NUNITO,
                fontSize: 30,
                color: net >= 0 ? GREEN : RED,
                letterSpacing: '-0.03em',
              }}
            >
              {net >= 0 ? '+' : '-'}¥{Math.abs(net).toLocaleString()}
            </p>

            {/* Income / Expense */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-400">收入</span>
                <span
                  className="font-bold tabular-nums text-sm"
                  style={{ fontFamily: NUNITO, color: GREEN }}
                >
                  +¥{totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-400">支出</span>
                <span
                  className="font-bold tabular-nums text-sm"
                  style={{ fontFamily: NUNITO, color: RED }}
                >
                  -¥{totalExpense.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f0ebe3' }} />

          {/* Top categories */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
              支出分类
            </p>
            <div className="flex flex-col gap-2.5">
              {topCats.map(([cat, amount]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-stone-500">{cat}</span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ fontFamily: NUNITO, color: RED }}
                      >
                        ¥{amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: '#f0ebe3' }}>
                      <div
                        className="h-1 rounded-full"
                        style={{
                          background: TERRA,
                          opacity: 0.6,
                          width: `${Math.min(100, (amount / totalExpense) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add button */}
          <button
            className="w-full text-sm font-semibold py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: TERRA, touchAction: 'manipulation' }}
          >
            ＋ 记一笔
          </button>
        </div>
      </div>

      {/* ── Right main area ── */}
      <div className="flex-1 min-w-0">
        {/* Sticky search bar */}
        <div
          className="sticky top-0 z-10 px-6 py-4"
          style={{
            background: '#faf8f4e8',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e8e2d8',
          }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: '#ede8df' }}
          >
            <span className="text-stone-300 text-sm">🔍</span>
            <input
              className="flex-1 bg-transparent text-sm text-stone-700 placeholder-stone-300 outline-none"
              placeholder="搜索备注或分类…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-stone-300 hover:text-stone-500 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="px-6 py-5 max-w-2xl space-y-7">
          {grouped.map(([date, items]) => {
            const dayExp = items
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);
            const dayInc = items
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date}>
                <div
                  className="flex items-center justify-between mb-2 pb-2"
                  style={{ borderBottom: '1px solid #e8e2d8' }}
                >
                  <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
                    {formatDate(date)}
                  </span>
                  <div className="flex gap-2 text-xs tabular-nums" style={{ fontFamily: NUNITO }}>
                    {dayInc > 0 && (
                      <span style={{ color: GREEN }}>+¥{dayInc.toLocaleString()}</span>
                    )}
                    {dayExp > 0 && <span style={{ color: RED }}>-¥{dayExp.toLocaleString()}</span>}
                  </div>
                </div>

                <div>
                  {items.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-3.5 group cursor-pointer"
                      style={{ borderBottom: i < items.length - 1 ? '1px solid #f0ebe3' : 'none' }}
                    >
                      <div
                        className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: t.type === 'expense' ? RED : GREEN, opacity: 0.55 }}
                      />
                      <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 leading-tight">
                          {t.category}
                        </p>
                        {t.note && (
                          <p className="text-xs text-stone-400 truncate mt-0.5">{t.note}</p>
                        )}
                      </div>
                      <p
                        className="font-bold tabular-nums flex-shrink-0"
                        style={{
                          fontFamily: NUNITO,
                          fontSize: 16,
                          color: t.type === 'expense' ? RED : GREEN,
                          letterSpacing: '-0.015em',
                        }}
                      >
                        {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                      </p>
                      <button
                        aria-label="删除"
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-opacity w-6 h-6 flex items-center justify-center text-base"
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
      </div>
    </div>
  );
}
