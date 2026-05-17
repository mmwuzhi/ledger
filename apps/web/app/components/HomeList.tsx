'use client';
// Home page — transaction list with sidebar summary
// Design: 暖卡片 (cream canvas, white date-group cards, terracotta accent)
// Font: Nunito (amounts), system-ui (labels)

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Transaction, Category } from '@moneybook/core';
import { EmptyState } from './EmptyState';
import { getBool, SETTINGS_KEYS } from '@/lib/settings';
import { apiBase } from '@/lib/api';

// ── Design tokens ─────────────────────────────────────────────────────────────

const NUNITO = "'Nunito', 'Helvetica Neue', sans-serif";
const TERRA = '#b5693a';
const GREEN = '#2d7a4f';
const RED = '#b5402a';
const CANVAS = '#f5f0e8';

// ── Types ─────────────────────────────────────────────────────────────────────

type EnrichedTransaction = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: 'income' | 'expense';
  icon: string;
  category: string;
  amount: number;
  note: string;
};

type Grouped = [string, EnrichedTransaction[]][];

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    dateFrom: `${y}-${m}-01`,
    dateTo: `${y}-${m}-31`,
    label: `${y}年${now.getMonth() + 1}月`,
  };
}

function enrich(transactions: Transaction[], categories: Category[]): EnrichedTransaction[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return transactions.map((t) => {
    const cat = catMap.get(t.categoryId);
    return {
      id: t.id,
      date: t.date.slice(0, 10),
      type: t.type,
      icon: cat?.icon ?? '📝',
      category: cat?.name ?? '其他',
      amount: t.amount,
      note: t.note ?? '',
    };
  });
}

function groupByDate(items: EnrichedTransaction[]): Grouped {
  const map = new Map<string, EnrichedTransaction[]>();
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

function getCatBreakdown(items: EnrichedTransaction[], totalExpense: number) {
  const map = new Map<string, number>();
  items
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
  return { topCats: [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5), totalExpense };
}

function computeDailyExpense(
  items: EnrichedTransaction[],
  dateFrom: string,
): { day: number; amount: number }[] {
  const [y, m] = dateFrom.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayDay = new Date().getDate();
  const cutoff = Math.min(daysInMonth, todayDay);
  const map = new Map<number, number>();
  for (const t of items) {
    if (t.type === 'expense') {
      const d = parseInt(t.date.slice(8, 10));
      map.set(d, (map.get(d) ?? 0) + t.amount);
    }
  }
  return Array.from({ length: cutoff }, (_, i) => ({
    day: i + 1,
    amount: map.get(i + 1) ?? 0,
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
  monthLabel: string;
  hideIncome: boolean;
  onGoToMe: () => void;
  onAdd: () => void;
}

function Sidebar({
  net,
  totalIncome,
  totalExpense,
  topCats,
  monthLabel,
  hideIncome,
  onGoToMe,
  onAdd,
}: SidebarProps) {
  return (
    <div className="flex flex-col p-5 h-full gap-5">
      <div className="flex items-center gap-2 pt-1">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0"    width="18" height="3"   rx="1" fill="#b5693a" />
          <rect x="0" y="5.5"  width="12" height="2.5" rx="1" fill="#b5693a" />
          <rect x="0" y="9.5"  width="9"  height="2.5" rx="1" fill="#b5693a" />
          <rect x="0" y="13.5" width="17" height="3"   rx="1" fill="#b5693a" />
        </svg>
        <span className="font-semibold text-stone-800 text-base tracking-tight">记账本</span>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
          {monthLabel}
        </p>
        <p className="text-xs text-stone-400 mb-0.5">{hideIncome ? '本月支出' : '本月结余'}</p>
        <p
          className="font-extrabold tabular-nums leading-none mb-4"
          style={{
            fontFamily: NUNITO,
            fontSize: 30,
            color: hideIncome ? RED : net >= 0 ? GREEN : RED,
            letterSpacing: '-0.03em',
          }}
        >
          {hideIncome
            ? `¥${totalExpense.toLocaleString()}`
            : `${net > 0 ? '+' : net < 0 ? '-' : ''}¥${Math.abs(net).toLocaleString()}`}
        </p>
        <div className="flex flex-col gap-2">
          {!hideIncome && (
            <div className="flex justify-between">
              <span className="text-xs text-stone-400">收入</span>
              <span
                className="font-bold tabular-nums text-sm"
                style={{ fontFamily: NUNITO, color: GREEN }}
              >
                ¥{totalIncome.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-xs text-stone-400">支出</span>
            <span
              className="font-bold tabular-nums text-sm"
              style={{ fontFamily: NUNITO, color: RED }}
            >
              ¥{totalExpense.toLocaleString()}
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
                    width: `${totalExpense > 0 ? Math.min(100, (amount / totalExpense) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {topCats.length === 0 && <p className="text-xs text-stone-300">暂无支出记录</p>}
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={onGoToMe}
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
        onClick={onAdd}
        className="w-full text-sm font-semibold py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: TERRA, touchAction: 'manipulation' }}
      >
        ＋ 记一笔
      </button>
    </div>
  );
}

interface RightPanelProps {
  enriched: EnrichedTransaction[];
  dateFrom: string;
}

function RightPanel({ enriched, dateFrom }: RightPanelProps) {
  const daily = useMemo(() => computeDailyExpense(enriched, dateFrom), [enriched, dateFrom]);
  const maxAmount = Math.max(...daily.map((d) => d.amount), 1);
  const spentDays = daily.filter((d) => d.amount > 0);
  const avgDaily = spentDays.length > 0
    ? spentDays.reduce((s, d) => s + d.amount, 0) / spentDays.length
    : 0;
  const todayDay = new Date().getDate();
  const hasData = spentDays.length > 0;

  return (
    <div
      className="hidden xl:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{ background: '#faf8f5', borderLeft: '1px solid #e8e2d8' }}
    >
      <div className="p-5 flex flex-col gap-5">
        <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 pt-1">
          每日支出
        </p>

        {!hasData ? (
          <p className="text-xs text-stone-300">本月暂无支出</p>
        ) : (
          <>
            <div className="flex items-end gap-px" style={{ height: 72 }}>
              {daily.map(({ day, amount }) => {
                const isToday = day === todayDay;
                const h = amount > 0 ? Math.max(3, (amount / maxAmount) * 72) : 2;
                return (
                  <div
                    key={day}
                    className="flex-1 rounded-sm"
                    style={{
                      height: h,
                      alignSelf: 'flex-end',
                      background: isToday ? TERRA : amount > 0 ? TERRA : '#e8e2d8',
                      opacity: isToday ? 1 : amount > 0 ? 0.5 : 0.35,
                    }}
                    title={amount > 0 ? `${day}日 ¥${amount.toFixed(0)}` : `${day}日`}
                  />
                );
              })}
            </div>

            <div className="flex justify-between" style={{ marginTop: -12 }}>
              <span className="text-stone-300" style={{ fontSize: 10 }}>1日</span>
              <span className="text-stone-300" style={{ fontSize: 10 }}>{daily.length}日</span>
            </div>

            {avgDaily > 0 && (
              <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 12 }}>
                <p className="text-xs text-stone-400 mb-1">日均支出</p>
                <p
                  className="font-bold tabular-nums"
                  style={{ fontFamily: NUNITO, fontSize: 15, color: RED, letterSpacing: '-0.015em' }}
                >
                  ¥{avgDaily.toFixed(0)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface TransactionListProps {
  grouped: Grouped;
  isEmpty: boolean;
  isLoading: boolean;
  hasSearch: boolean;
  onDelete: (id: string) => void;
}

function TransactionList({ grouped, isEmpty, isLoading, hasSearch, onDelete }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-300">
        <div className="text-sm">加载中…</div>
      </div>
    );
  }

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
                  onClick={() => onDelete(t.id)}
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
      {isEmpty && !isLoading && <EmptyState type={hasSearch ? 'no-results' : 'empty'} />}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function HomeList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hideIncome, setHideIncome] = useState(false);

  // Read settings from localStorage on mount and whenever the window regains focus
  // (e.g. user changes hideIncome on /me and navigates back).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sync = () => setHideIncome(getBool(SETTINGS_KEYS.hideIncome, false));
    sync();
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { dateFrom, dateTo, label: monthLabel } = useMemo(() => currentMonthRange(), []);

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', dateFrom, dateTo],
    queryFn: () =>
      fetch(`${apiBase}/api/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`).then((r) => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch(`${apiBase}/api/categories`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiBase}/api/transactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const enriched = useMemo(() => enrich(rawTransactions, categories), [rawTransactions, categories]);

  const filtered = useMemo(
    () =>
      enriched.filter((t) => {
        if (hideIncome && t.type === 'income') return false;
        return !search || t.note.includes(search) || t.category.includes(search);
      }),
    [enriched, search, hideIncome]
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // Summary numbers always use full enriched data (income exclusion affects display labels only)
  const totalIncome = useMemo(
    () => enriched.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [enriched]
  );
  const totalExpense = useMemo(
    () => enriched.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [enriched]
  );
  const net = totalIncome - totalExpense;
  const topCats = useMemo(
    () => getCatBreakdown(enriched, totalExpense).topCats,
    [enriched, totalExpense]
  );

  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleAdd = () => router.push('/add');
  const handleGoToMe = () => router.push('/me');

  return (
    <div
      className="min-h-screen"
      style={{
        background: CANVAS,
        fontFamily: 'system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
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
            monthLabel={monthLabel}
            hideIncome={hideIncome}
            onGoToMe={handleGoToMe}
            onAdd={handleAdd}
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
            {/* Narrow: title */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <h1 className="text-xl font-semibold text-stone-800 tracking-tight">记账本</h1>
            </div>

            {/* Narrow: summary cards */}
            <div className="flex gap-3 mb-3 lg:hidden">
              <div
                className="flex-1 rounded-xl px-3 py-2.5"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(90,60,30,0.07)' }}
              >
                <p className="text-xs text-stone-400 mb-0.5">
                  {hideIncome ? '本月支出' : '本月结余'}
                </p>
                <p
                  className="font-bold tabular-nums"
                  style={{
                    fontFamily: NUNITO,
                    fontSize: 17,
                    color: hideIncome ? RED : net >= 0 ? GREEN : RED,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {hideIncome
                    ? `¥${totalExpense.toLocaleString()}`
                    : `${net > 0 ? '+' : net < 0 ? '-' : ''}¥${Math.abs(net).toLocaleString()}`}
                </p>
              </div>
              {!hideIncome && (
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
                    ¥{totalExpense.toLocaleString()}
                  </p>
                </div>
              )}
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

          {/* Transaction list */}
          <div className="px-5 lg:px-6 py-5 pb-28 lg:pb-8">
            <TransactionList
              grouped={grouped}
              isEmpty={filtered.length === 0}
              isLoading={txLoading}
              hasSearch={!!search}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* ── Right panel (xl+) ── */}
        <RightPanel enriched={enriched} dateFrom={dateFrom} />
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
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:scale-95 transition-all"
          style={{ color: TERRA, touchAction: 'manipulation' }}
          aria-label="账单"
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
            onClick={handleAdd}
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
          onClick={handleGoToMe}
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
