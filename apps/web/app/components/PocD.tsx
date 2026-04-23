'use client';
// POC D — 宽松手账
// Visual thesis: 手账本翻开的感觉——超大留白，Nunito 数字粗大醒目，日期像杂志大标题，最宽松最呼吸
// Difference from A: much more vertical rhythm, date headers are large anchors, amounts are 20px+, 3-stat summary bar
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
  if (d === todayStr) return { main: '今天', sub: `${date.getMonth() + 1}月${date.getDate()}日` };
  if (d === yesterdayStr)
    return { main: '昨天', sub: `${date.getMonth() + 1}月${date.getDate()}日` };
  return {
    main: `${date.getDate()}`,
    sub: `${date.getMonth() + 1}月 · ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]}`,
  };
}

const NUNITO = "'Nunito', 'Helvetica Neue', sans-serif";
const TERRA = '#b5693a';
const GREEN = '#2d7a4f';
const RED = '#b5402a';

export default function PocD() {
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
        background: '#faf8f4',
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: '#faf8f4e8',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e8e2d8',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-semibold text-stone-800 tracking-tight">记账本</h1>
            <button
              className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: TERRA, touchAction: 'manipulation' }}
            >
              ＋ 记一笔
            </button>
          </div>

          {/* 3-stat summary */}
          <div
            className="flex gap-0 mb-5"
            style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e8e2d8' }}
          >
            {[
              { label: '本月收入', value: totalIncome, sign: '+', color: GREEN },
              { label: '本月支出', value: totalExpense, sign: '-', color: RED },
              {
                label: '结余',
                value: Math.abs(net),
                sign: net >= 0 ? '+' : '-',
                color: net >= 0 ? GREEN : RED,
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex-1 px-4 py-3"
                style={{
                  background: '#fff',
                  borderLeft: i > 0 ? '1px solid #f0ebe3' : 'none',
                }}
              >
                <p className="text-xs text-stone-400 mb-1">{item.label}</p>
                <p
                  className="font-bold tabular-nums"
                  style={{
                    fontFamily: NUNITO,
                    color: item.color,
                    fontSize: 20,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {item.sign}¥{item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: '#f0ebe3' }}
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
      </div>

      {/* Transaction list */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        {grouped.map(([date, items]) => {
          const { main, sub } = formatDate(date);
          const dayExp = items
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0);
          const dayInc = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

          return (
            <div key={date} className="mt-8">
              {/* Date header — large, editorial */}
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="font-bold text-stone-800"
                    style={{
                      fontSize: 28,
                      fontFamily: NUNITO,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {main}
                  </span>
                  <span className="text-xs text-stone-400 mb-0.5">{sub}</span>
                </div>
                <div className="text-xs tabular-nums flex gap-2" style={{ fontFamily: NUNITO }}>
                  {dayInc > 0 && <span style={{ color: GREEN }}>+¥{dayInc.toLocaleString()}</span>}
                  {dayExp > 0 && <span style={{ color: RED }}>-¥{dayExp.toLocaleString()}</span>}
                </div>
              </div>

              {/* Rows */}
              <div>
                {items.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 py-4 group cursor-pointer"
                    style={{ borderTop: i === 0 ? '1px solid #e8e2d8' : '1px solid #f0ebe3' }}
                  >
                    <div
                      className="w-1 h-9 rounded-full flex-shrink-0"
                      style={{ background: t.type === 'expense' ? RED : GREEN, opacity: 0.55 }}
                    />
                    <span className="text-2xl leading-none flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 leading-tight">
                        {t.category}
                      </p>
                      {t.note && <p className="text-xs text-stone-400 truncate mt-0.5">{t.note}</p>}
                    </div>
                    <p
                      className="font-bold tabular-nums flex-shrink-0"
                      style={{
                        fontFamily: NUNITO,
                        fontSize: 18,
                        color: t.type === 'expense' ? RED : GREEN,
                        letterSpacing: '-0.02em',
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
  );
}
