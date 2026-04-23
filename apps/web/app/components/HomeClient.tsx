'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction, Category } from '@moneybook/core';
import { CURRENCIES } from '@moneybook/core';
import Link from 'next/link';

function getCurrencySymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '¥';
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const date = t.date.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(t);
  }
  return Array.from(map.entries());
}

export default function HomeClient() {
  const queryClient = useQueryClient();

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'income' | 'expense' | ''>('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const hasFilters = !!(
    keyword ||
    filterType ||
    filterCategoryId ||
    amountMin ||
    amountMax ||
    dateFrom ||
    dateTo
  );

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (keyword) p.set('keyword', keyword);
    if (filterType) p.set('type', filterType);
    if (filterCategoryId) p.set('categoryId', filterCategoryId);
    if (amountMin) p.set('amountMin', amountMin);
    if (amountMax) p.set('amountMax', amountMax);
    if (dateFrom) p.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
    if (dateTo) p.set('dateTo', `${dateTo}T23:59:59.999Z`);
    return p.toString();
  }, [keyword, filterType, filterCategoryId, amountMin, amountMax, dateFrom, dateTo]);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', params],
    queryFn: () => fetch(`/api/transactions${params ? `?${params}` : ''}`).then((r) => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/transactions', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('确定要删除这条记录吗？')) deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const clearFilters = () => {
    setKeyword('');
    setFilterType('');
    setFilterCategoryId('');
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const filteredCategories = filterType
    ? categories.filter((c) => c.type === filterType || c.type === 'both')
    : categories;

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const grouped = groupByDate(transactions);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">账单</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${hasFilters ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {showFilters ? '收起' : '筛选'}
                {hasFilters ? ' ●' : ''}
              </button>
              <Link
                href="/add"
                className="bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                ＋ 记账
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2">
            <span className="text-gray-400">🔍</span>
            <input
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
              placeholder="搜索备注..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button onClick={() => setKeyword('')} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 space-y-3 pb-1">
              {/* Type */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">类型</p>
                <div className="flex gap-2">
                  {(
                    [
                      ['', '全部'],
                      ['expense', '支出'],
                      ['income', '收入'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => {
                        setFilterType(val);
                        setFilterCategoryId('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterType === val ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">分类</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterCategoryId('')}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${!filterCategoryId ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    全部
                  </button>
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategoryId(cat.id)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors ${filterCategoryId === cat.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">金额范围</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="最小"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">日期范围</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
                  清除所有筛选
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Summary card */}
        {!hasFilters && transactions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 grid grid-cols-2 gap-4 shadow-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">本月收入</p>
              <p className="text-xl font-bold text-green-500">+¥{totalIncome.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">本月支出</p>
              <p className="text-xl font-bold text-red-500">-¥{totalExpense.toFixed(2)}</p>
            </div>
          </div>
        )}

        {hasFilters && <p className="text-xs text-gray-500">找到 {transactions.length} 条记录</p>}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">{hasFilters ? '🔍' : '📒'}</span>
            <p className="text-gray-500 text-lg">
              {hasFilters ? '没有找到匹配的记录' : '还没有记录'}
            </p>
            {!hasFilters && (
              <Link href="/add" className="mt-3 text-sm text-indigo-500 hover:underline">
                点击这里开始记账 →
              </Link>
            )}
          </div>
        )}

        {/* Transaction list grouped by date */}
        {!isLoading &&
          grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{date}</p>
                <p className="text-xs text-gray-400">
                  {items.filter((t) => t.type === 'expense').length > 0 && (
                    <span className="text-red-400">
                      -¥
                      {items
                        .filter((t) => t.type === 'expense')
                        .reduce((s, t) => s + t.amount, 0)
                        .toFixed(2)}
                    </span>
                  )}
                  {items.some((t) => t.type === 'income') &&
                    items.some((t) => t.type === 'expense') &&
                    ' · '}
                  {items.filter((t) => t.type === 'income').length > 0 && (
                    <span className="text-green-400">
                      +¥
                      {items
                        .filter((t) => t.type === 'income')
                        .reduce((s, t) => s + t.amount, 0)
                        .toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const cat = categoryMap[t.categoryId];
                  const symbol = getCurrencySymbol(t.currency ?? 'CNY');
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat?.icon ?? '📦'}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{cat?.name ?? '未知'}</p>
                          {t.note && <p className="text-xs text-gray-400">{t.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p
                          className={`text-base font-bold ${t.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}
                        >
                          {t.type === 'expense' ? '-' : '+'}
                          {symbol}
                          {t.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
