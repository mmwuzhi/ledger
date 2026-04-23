'use client';
// POC B — 精算台
// Visual thesis: 银行对账单精密感，等宽数字，冷白画布，深蓝主色，数据密度高
// Font: 'Geist Mono' for amounts, system-ui for labels
// Accent: #1e3a8a (deep navy)

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

const MONO = "'Geist Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace";

export default function PocB() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = SAMPLE.filter((t) => {
    if (search && !t.note.includes(search) && !t.category.includes(search)) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });
  const grouped = groupByDate(filtered);
  const totalIncome = SAMPLE.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = SAMPLE.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <div
      className="min-h-screen"
      style={{ background: '#f4f6f9', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-400">
                MoneyBook
              </p>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">账单明细</h1>
            </div>
            <button
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all active:scale-95 hover:brightness-110"
              style={{ background: '#1e3a8a', touchAction: 'manipulation' }}
            >
              <span className="text-base leading-none">＋</span> 新增
            </button>
          </div>

          {/* Summary — three bare numbers */}
          <div className="grid grid-cols-3 gap-px mb-5 bg-slate-100 rounded-xl overflow-hidden">
            {[
              { label: '收入', value: `+${totalIncome.toLocaleString()}`, color: '#0f766e' },
              { label: '支出', value: `-${totalExpense.toLocaleString()}`, color: '#b91c1c' },
              {
                label: '结余',
                value: net >= 0 ? `+${net.toLocaleString()}` : `-${Math.abs(net).toLocaleString()}`,
                color: net >= 0 ? '#1e3a8a' : '#b91c1c',
              },
            ].map((item) => (
              <div key={item.label} className="bg-white px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: MONO, color: item.color, letterSpacing: '-0.02em' }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Search + filter row */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-300 text-xs">⌕</span>
              <input
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-300 outline-none"
                placeholder="搜索…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className="px-3 py-2 font-medium transition-colors"
                  style={{
                    background: filterType === type ? '#1e3a8a' : 'transparent',
                    color: filterType === type ? '#fff' : '#64748b',
                    touchAction: 'manipulation',
                  }}
                >
                  {type === 'all' ? '全部' : type === 'income' ? '收入' : '支出'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table area */}
      <div className="max-w-3xl mx-auto px-6 py-4">
        {grouped.map(([date, items]) => (
          <div key={date} className="mb-1">
            {/* Date header row */}
            <div
              className="grid py-2 px-4 text-xs font-semibold tracking-[0.12em] uppercase text-slate-400"
              style={{ gridTemplateColumns: '1fr auto' }}
            >
              <span>
                {new Date(date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
              </span>
              <span style={{ fontFamily: MONO }}>
                {items.reduce((s, t) => (t.type === 'expense' ? s - t.amount : s + t.amount), 0) >=
                0
                  ? '+'
                  : ''}
                ¥
                {items
                  .reduce((s, t) => (t.type === 'expense' ? s - t.amount : s + t.amount), 0)
                  .toLocaleString()}
              </span>
            </div>

            {/* Transaction rows */}
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {items.map((t, i) => (
                <div
                  key={t.id}
                  className="grid items-center px-4 py-3 gap-3 group hover:bg-slate-50 transition-colors cursor-pointer"
                  style={{
                    gridTemplateColumns: 'auto 1fr auto auto',
                    borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-tight">{t.category}</p>
                    {t.note && <p className="text-xs text-slate-400 truncate">{t.note}</p>}
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums text-right"
                    style={{
                      fontFamily: MONO,
                      color: t.type === 'expense' ? '#b91c1c' : '#0f766e',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t.type === 'expense' ? '-' : '+'}¥{t.amount.toLocaleString()}
                  </div>
                  <button
                    aria-label="删除"
                    className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-opacity w-6 h-6 flex items-center justify-center"
                    style={{ touchAction: 'manipulation' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-24 text-slate-300">
            <div className="text-3xl mb-3 font-mono">—</div>
            <p className="text-sm">没有找到相关记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
