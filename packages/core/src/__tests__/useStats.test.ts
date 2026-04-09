import { Transaction, Category } from '../models';
import { CategoryBreakdown } from '../hooks/useStats';

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'txn-1',
  type: 'expense',
  amount: 100,
  categoryId: 'cat-1',
  note: '',
  date: '2024-01-15T12:00:00.000Z',
  receiptId: null,
  recurringId: null,
  bookId: 'default',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  deletedAt: null,
  ...overrides,
});

/**
 * Computes monthly stats the same way useMonthlyStats does.
 */
function computeMonthlyStats(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    count: transactions.length,
  };
}

/**
 * Computes overview stats the same way useOverviewStats does.
 */
function computeOverviewStats(all: Transaction[]) {
  const totalRecords = all.length;
  if (totalRecords === 0) {
    return { totalRecords: 0, daysSinceFirst: 0 };
  }
  const dates = all.map(t => new Date(t.date).getTime());
  const firstDate = new Date(Math.min(...dates));
  const daysSinceFirst = Math.ceil((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  return { totalRecords, daysSinceFirst };
}

describe('Monthly stats calculation', () => {
  it('calculates income, expense, and balance correctly', () => {
    const transactions: Transaction[] = [
      makeTransaction({ id: 'txn-1', type: 'income', amount: 5000 }),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200 }),
      makeTransaction({ id: 'txn-3', type: 'expense', amount: 300 }),
      makeTransaction({ id: 'txn-4', type: 'income', amount: 1000 }),
    ];

    const stats = computeMonthlyStats(transactions);
    expect(stats.totalIncome).toBe(6000);
    expect(stats.totalExpense).toBe(500);
    expect(stats.balance).toBe(5500);
    expect(stats.count).toBe(4);
  });

  it('returns zeros for empty transaction list', () => {
    const stats = computeMonthlyStats([]);
    expect(stats.totalIncome).toBe(0);
    expect(stats.totalExpense).toBe(0);
    expect(stats.balance).toBe(0);
    expect(stats.count).toBe(0);
  });

  it('only counts transactions within date range', () => {
    const from = '2024-01-01T00:00:00.000Z';
    const to = '2024-01-31T23:59:59.999Z';

    const allTransactions: Transaction[] = [
      makeTransaction({ id: 'txn-1', type: 'expense', amount: 100, date: '2024-01-15T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200, date: '2024-02-15T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', type: 'income', amount: 500, date: '2024-01-20T12:00:00.000Z' }),
    ];

    // Simulate findByDateRange filtering
    const filtered = allTransactions.filter(t => t.date >= from && t.date <= to);
    const stats = computeMonthlyStats(filtered);

    expect(stats.totalExpense).toBe(100);
    expect(stats.totalIncome).toBe(500);
    expect(stats.balance).toBe(400);
    expect(stats.count).toBe(2);
  });
});

describe('Overview stats calculation', () => {
  it('returns correct total record count', () => {
    const transactions: Transaction[] = [
      makeTransaction({ id: 'txn-1' }),
      makeTransaction({ id: 'txn-2' }),
      makeTransaction({ id: 'txn-3' }),
    ];

    const stats = computeOverviewStats(transactions);
    expect(stats.totalRecords).toBe(3);
  });

  it('calculates days since first record', () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

    const transactions: Transaction[] = [
      makeTransaction({ id: 'txn-1', date: threeDaysAgo }),
      makeTransaction({ id: 'txn-2', date: oneDayAgo }),
    ];

    const stats = computeOverviewStats(transactions);
    expect(stats.totalRecords).toBe(2);
    expect(stats.daysSinceFirst).toBeGreaterThanOrEqual(3);
    expect(stats.daysSinceFirst).toBeLessThanOrEqual(4);
  });

  it('returns zeros when no records exist', () => {
    const stats = computeOverviewStats([]);
    expect(stats.totalRecords).toBe(0);
    expect(stats.daysSinceFirst).toBe(0);
  });
});

const CHART_COLORS = [
  '#6366f1', '#f43f5e', '#eab308', '#22c55e', '#3b82f6',
  '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#64748b',
];

const makeCategory = (overrides: Partial<Category>): Category => ({
  id: 'cat-1',
  name: '餐饮',
  icon: '🍜',
  type: 'expense',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  ...overrides,
});

function computeCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income',
): CategoryBreakdown[] {
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const filtered = transactions.filter(t => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const grouped: Record<string, number> = {};
  for (const t of filtered) {
    grouped[t.categoryId] = (grouped[t.categoryId] ?? 0) + t.amount;
  }

  return Object.entries(grouped)
    .map(([categoryId, amount], i) => {
      const cat = categoryMap[categoryId];
      return {
        categoryId,
        categoryName: cat?.name ?? '未知',
        categoryIcon: cat?.icon ?? '📦',
        amount,
        percentage: Math.round((amount / total) * 100),
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

describe('Category breakdown calculation', () => {
  const categories = [
    makeCategory({ id: 'cat-food', name: '餐饮', icon: '🍜' }),
    makeCategory({ id: 'cat-transport', name: '交通', icon: '🚗' }),
    makeCategory({ id: 'cat-shopping', name: '购物', icon: '🛍️' }),
  ];

  it('groups transactions by category with correct amounts', () => {
    const transactions = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 30 }),
      makeTransaction({ id: 't2', categoryId: 'cat-food', amount: 50 }),
      makeTransaction({ id: 't3', categoryId: 'cat-transport', amount: 20 }),
    ];
    const result = computeCategoryBreakdown(transactions, categories, 'expense');
    expect(result).toHaveLength(2);
    expect(result[0].categoryName).toBe('餐饮');
    expect(result[0].amount).toBe(80);
    expect(result[1].categoryName).toBe('交通');
    expect(result[1].amount).toBe(20);
  });

  it('calculates percentages correctly', () => {
    const transactions = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 75 }),
      makeTransaction({ id: 't2', categoryId: 'cat-transport', amount: 25 }),
    ];
    const result = computeCategoryBreakdown(transactions, categories, 'expense');
    expect(result[0].percentage).toBe(75);
    expect(result[1].percentage).toBe(25);
  });

  it('returns empty array when no transactions of that type', () => {
    const transactions = [
      makeTransaction({ id: 't1', type: 'income', categoryId: 'cat-food', amount: 100 }),
    ];
    const result = computeCategoryBreakdown(transactions, categories, 'expense');
    expect(result).toHaveLength(0);
  });

  it('sorts by amount descending', () => {
    const transactions = [
      makeTransaction({ id: 't1', categoryId: 'cat-food', amount: 10 }),
      makeTransaction({ id: 't2', categoryId: 'cat-transport', amount: 50 }),
      makeTransaction({ id: 't3', categoryId: 'cat-shopping', amount: 30 }),
    ];
    const result = computeCategoryBreakdown(transactions, categories, 'expense');
    expect(result.map(r => r.categoryName)).toEqual(['交通', '购物', '餐饮']);
  });

  it('handles unknown category gracefully', () => {
    const transactions = [
      makeTransaction({ id: 't1', categoryId: 'cat-unknown', amount: 100 }),
    ];
    const result = computeCategoryBreakdown(transactions, categories, 'expense');
    expect(result[0].categoryName).toBe('未知');
    expect(result[0].categoryIcon).toBe('📦');
  });
});
