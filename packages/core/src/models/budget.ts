import { z } from 'zod';

export const BudgetSchema = z.object({
  id: z.string(),
  categoryId: z.string().nullable(), // null means total/overall budget
  amount: z.number().positive(),
  year: z.number(),
  month: z.number().min(1).max(12),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Budget = z.infer<typeof BudgetSchema>;
export type CreateBudgetInput = Pick<Budget, 'categoryId' | 'amount' | 'year' | 'month'>;
export type UpdateBudgetInput = Pick<Budget, 'amount'>;
