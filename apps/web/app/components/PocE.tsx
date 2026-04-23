'use client';
// POC E — 暖卡片 (responsive: narrow=single-column, wide=sidebar+list)
// Visual thesis: 奶油底 + 白卡片日期组，宽屏左侧固定侧栏
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

type SampleItem = (typeof SAMPLE)[number];
type Grouped = [string, SampleItem[]][];

function groupByDate(items: SampleItem[]): Grouped {
  const map = new Map<string, SampleItem[]>();
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
const CANVAS = '#f5f0e8';

function getCatBreakdown(items: SampleItem[]) {
  const map = new Map<string, number>();
  items
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: TERRA, fontSize: size * 0.4 }}
    >
      我
    </div>
  );
}

interface SidebarProps {
  net: number;
  totalIncome: number;
  totalExpense: number;
  topCats: [string, number][];
}

function Sidebar({ net, totalIncome, totalExpense, topCats }: SidebarProps) {
  return (
    <div className="flex flex-col p-5 h-full gap-5">
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xl">📒</span>
        <span className="font-semibold text-stone-800 text-base tracking-tight">记账本</span>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
          2026年4月
        </p>
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
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-xs text-stone-400">收入</span>
            <span
              className="font-bold tabular-nums text-sm"
              style={{ fontFamily: NUNITO, color: GREEN }}
            >
              +¥{totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
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

      <div style={{ borderTop: '1px solid #f0ebe3' }} />

      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
          支出分类
        </p>
        <div className="flex flex-col gap-3">
          {topCats.map(([cat, amount]) => (
            <div key={cat}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-stone-500">{cat}</span>
                <span className="text-xs tabular-nums" style={{ fontFamily: NUNITO, color: RED }}>
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
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <button
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-50 active:scale-95 w-full text-left"
        style={{ border: '1px solid #f0ebe3', touchAction: 'manipulation' }}
      >
        <Avatar size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700 leading-tight">我的</p>
          <p className="text-xs text-stone-400">账本设置 · 个人信息</p>
        </div>
        <span className="text-stone-300 text-sm">›</span>
      </button>

      <button
        className="w-full text-sm font-semibold py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: TERRA, touchAction: 'manipulation' }}
      >
        ＋ 记一笔
      </button>
    </div>
  );
}

interface TransactionListProps {
  grouped: Grouped;
  isEmpty: boolean;
}

function TransactionList({ grouped, isEmpty }: TransactionListProps) {
  return (
    <div
      className="grid gap-4 items-start"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
    >
      {grouped.map(([date, items]) => {
        const dayExp = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const dayInc = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        return (
          <div
            key={date}
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              boxShadow: '0 1px 3px rgba(90,60,30,0.07), 0 3px 10px rgba(90,60,30,0.04)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #f0ebe3' }}
            >
              <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
                {formatDate(date)}
              </span>
              <div className="flex gap-2 text-xs tabular-nums" style={{ fontFamily: NUNITO }}>
                {dayInc > 0 && <span style={{ color: GREEN }}>+¥{dayInc.toLocaleString()}</span>}
                {dayExp > 0 && <span style={{ color: RED }}>-¥{dayExp.toLocaleString()}</span>}
              </div>
            </div>
            {items.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3.5 group cursor-pointer transition-colors hover:bg-stone-50"
                style={{ borderTop: i > 0 ? '1px solid #f7f4ef' : 'none' }}
              >
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ background: t.type === 'expense' ? RED : GREEN, opacity: 0.5 }}
                />
                <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 leading-tight">{t.category}</p>
                  {t.note && <p className="text-xs text-stone-400 truncate mt-0.5">{t.note}</p>}
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
        );
      })}
      {isEmpty && (
        <div className="text-center py-24 text-stone-300">
          <div className="text-4xl mb-3">📒</div>
          <p className="text-sm">没有找到相关记录</p>
        </div>
      )}
    </div>
  );
}

export default function PocE() {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE.filter(
    (t) => !search || t.note.includes(search) || t.category.includes(search)
  );
  const grouped = groupByDate(filtered);
  const totalIncome = SAMPLE.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = SAMPLE.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;
  const topCats = getCatBreakdown(SAMPLE);

  return (
    <div
      className="min-h-screen"
      style={{
        background: CANVAS,
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      <div className="flex min-h-screen">
        {/* ── Sidebar (lg+) ── */}
        <div
          className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto"
          style={{ background: '#fff', borderRight: '1px solid #e8e2d8' }}
        >
          <Sidebar
            net={net}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            topCats={topCats}
          />
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0">
          {/* Sticky toolbar */}
          <div
            className="sticky top-0 z-10 px-5 lg:px-6 py-4"
            style={{
              background: `${CANVAS}e8`,
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid #e8e2d8',
            }}
          >
            {/* Narrow: title only */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <h1 className="text-xl font-semibold text-stone-800 tracking-tight">记账本</h1>
            </div>

            {/* Narrow: summary */}
            <div className="flex gap-3 mb-3 lg:hidden">
              <div
                className="flex-1 rounded-xl px-3 py-2.5"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}
              >
                <p className="text-xs text-stone-400 mb-0.5">本月结余</p>
                <p
                  className="font-bold tabular-nums"
                  style={{
                    fontFamily: NUNITO,
                    fontSize: 17,
                    color: net >= 0 ? GREEN : RED,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {net >= 0 ? '+' : '-'}¥{Math.abs(net).toLocaleString()}
                </p>
              </div>
              <div
                className="flex-1 rounded-xl px-3 py-2.5"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}
              >
                <p className="text-xs text-stone-400 mb-0.5">支出</p>
                <p
                  className="font-bold tabular-nums"
                  style={{
                    fontFamily: NUNITO,
                    fontSize: 17,
                    color: RED,
                    letterSpacing: '-0.015em',
                  }}
                >
                  -¥{totalExpense.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Search */}
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

          {/* List */}
          <div className="px-5 lg:px-6 py-5 pb-28 lg:pb-8">
            <TransactionList grouped={grouped} isEmpty={filtered.length === 0} />
          </div>
        </div>
      </div>

      {/* ── Bottom tab bar (mobile only) ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center"
        style={{
          background: '#fff',
          borderTop: '1px solid #e8e2d8',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <button
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:scale-95 transition-all"
          style={{ color: TERRA, touchAction: 'manipulation' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
          <span className="text-xs font-medium">账单</span>
        </button>

        <div className="flex-1 flex items-center justify-center" style={{ marginTop: -20 }}>
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-light shadow-lg active:scale-95 transition-all"
            style={{
              background: TERRA,
              boxShadow: `0 4px 16px ${TERRA}55`,
              touchAction: 'manipulation',
            }}
            aria-label="记一笔"
          >
            ＋
          </button>
        </div>

        <button
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:scale-95 transition-all"
          style={{ color: '#b0a090', touchAction: 'manipulation' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span className="text-xs font-medium">我的</span>
        </button>
      </div>
    </div>
  );
}
