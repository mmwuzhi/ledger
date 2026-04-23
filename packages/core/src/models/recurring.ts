import { z } from 'zod';

export const RecurringFrequency = z.enum(['daily', 'weekly', 'monthly']);
export type RecurringFrequency = z.infer<typeof RecurringFrequency>;

export const RecurringTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string(),
  note: z.string().default(''),
  frequency: RecurringFrequency,
  dayOfWeek: z.number().min(0).max(6).nullable().default(null), // 0=Sun, for weekly
  dayOfMonth: z.number().min(1).max(31).nullable().default(null), // for monthly
  startDate: z.string(), // ISO date YYYY-MM-DD
  endDate: z.string().nullable().default(null), // null = no end
  lastGeneratedDate: z.string().nullable().default(null), // track last auto-generation
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>;

export type CreateRecurringInput = Pick<
  RecurringTransaction,
  | 'type'
  | 'amount'
  | 'categoryId'
  | 'note'
  | 'frequency'
  | 'dayOfWeek'
  | 'dayOfMonth'
  | 'startDate'
  | 'endDate'
>;

export type UpdateRecurringInput = Partial<CreateRecurringInput & { enabled: boolean }>;
