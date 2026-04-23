import { useQuery } from '@tanstack/react-query';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
}

export const STATS_KEYS = {
  monthly: (year: number, month: number) => ['stats', 'monthly', year, month] as const,
  overview: ['stats', 'overview'] as const,
  categoryBreakdown: (year: number, month: number) => ['stats', 'category', year, month] as const,
  trend: (months: number) => ['stats', 'trend', months] as const,
};

export function useMonthlyStats(repo: ITransactionRepository, year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`;

  return useQuery({
    queryKey: STATS_KEYS.monthly(year, month),
    queryFn: async () => {
      const transactions = await repo.findByDateRange(from, to);
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: transactions.length,
      };
    },
  });
}

const CHART_COLORS = [
  '#6366f1',
  '#f43f5e',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#64748b',
];

export function useCategoryBreakdown(
  transactionRepo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
  year: number,
  month: number,
  type: 'expense' | 'income' = 'expense'
) {
  const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`;

  return useQuery({
    queryKey: [...STATS_KEYS.categoryBreakdown(year, month), type],
    queryFn: async (): Promise<CategoryBreakdown[]> => {
      const [transactions, categories] = await Promise.all([
        transactionRepo.findByDateRange(from, to),
        categoryRepo.findAll(),
      ]);
      const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
      const filtered = transactions.filter((t) => t.type === type);
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
    },
  });
}

export function useMonthlyTrend(repo: ITransactionRepository, months: number = 6) {
  return useQuery({
    queryKey: STATS_KEYS.trend(months),
    queryFn: async (): Promise<MonthlyTrend[]> => {
      const now = new Date();
      const result: MonthlyTrend[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
        const lastDay = new Date(year, month, 0).getDate();
        const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`;

        const transactions = await repo.findByDateRange(from, to);
        const income = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        result.push({
          year,
          month,
          label: `${month}月`,
          income,
          expense,
        });
      }

      return result;
    },
  });
}

export function useOverviewStats(repo: ITransactionRepository) {
  return useQuery({
    queryKey: STATS_KEYS.overview,
    queryFn: async () => {
      const all = await repo.findAll();
      const totalRecords = all.length;
      if (totalRecords === 0) {
        return { totalRecords: 0, daysSinceFirst: 0 };
      }
      const dates = all.map((t) => new Date(t.date).getTime());
      const firstDate = new Date(Math.min(...dates));
      const daysSinceFirst = Math.ceil((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      return { totalRecords, daysSinceFirst };
    },
  });
}
