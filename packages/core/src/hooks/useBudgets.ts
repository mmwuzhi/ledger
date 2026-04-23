import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBudgetRepository } from '../repositories/IBudgetRepository';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { CreateBudgetInput, UpdateBudgetInput } from '../models/budget';

export const BUDGET_KEYS = {
  month: (year: number, month: number) => ['budgets', year, month] as const,
  progress: (year: number, month: number) => ['budgets', 'progress', year, month] as const,
};

export interface BudgetProgress {
  budgetId: string;
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number; // 0-100+
  isOverBudget: boolean;
}

export function useBudgets(repo: IBudgetRepository, year: number, month: number) {
  return useQuery({
    queryKey: BUDGET_KEYS.month(year, month),
    queryFn: () => repo.findByMonth(year, month),
  });
}

export function useBudgetProgress(
  budgetRepo: IBudgetRepository,
  transactionRepo: ITransactionRepository,
  categoryRepo: ICategoryRepository,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: BUDGET_KEYS.progress(year, month),
    queryFn: async (): Promise<BudgetProgress[]> => {
      const [budgets, categories] = await Promise.all([
        budgetRepo.findByMonth(year, month),
        categoryRepo.findAll(),
      ]);
      if (budgets.length === 0) return [];

      const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`;
      const transactions = await transactionRepo.findByDateRange(from, to);
      const expenses = transactions.filter((t) => t.type === 'expense');

      const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      return budgets
        .map((budget) => {
          let spentAmount: number;
          let categoryName: string;
          let categoryIcon: string;

          if (budget.categoryId === null) {
            // Overall budget
            spentAmount = expenses.reduce((sum, t) => sum + t.amount, 0);
            categoryName = '总预算';
            categoryIcon = '💰';
          } else {
            spentAmount = expenses
              .filter((t) => t.categoryId === budget.categoryId)
              .reduce((sum, t) => sum + t.amount, 0);
            const cat = categoryMap[budget.categoryId];
            categoryName = cat?.name ?? '未知';
            categoryIcon = cat?.icon ?? '📦';
          }

          const percentage =
            budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

          return {
            budgetId: budget.id,
            categoryId: budget.categoryId,
            categoryName,
            categoryIcon,
            budgetAmount: budget.amount,
            spentAmount,
            percentage,
            isOverBudget: spentAmount > budget.amount,
          };
        })
        .sort((a, b) => {
          // Overall budget first, then by percentage descending
          if (a.categoryId === null) return -1;
          if (b.categoryId === null) return 1;
          return b.percentage - a.percentage;
        });
    },
  });
}

export function useCreateBudget(repo: IBudgetRepository, year: number, month: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => repo.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.month(year, month) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.progress(year, month) });
    },
  });
}

export function useUpdateBudget(repo: IBudgetRepository, year: number, month: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) => repo.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.month(year, month) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.progress(year, month) });
    },
  });
}

export function useDeleteBudget(repo: IBudgetRepository, year: number, month: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.month(year, month) });
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.progress(year, month) });
    },
  });
}
