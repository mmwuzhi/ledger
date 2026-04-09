import { z } from 'zod';

export type TransactionType = 'income' | 'expense';

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  note: z.string().default(''),
  date: z.string().datetime(),           // ISO 8601
  receiptId: z.string().uuid().nullable().default(null),
  recurringId: z.string().nullable().default(null),
  bookId: z.string().default('default'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export type CreateTransactionInput = Pick<Transaction, 'type' | 'amount' | 'categoryId' | 'note' | 'date' | 'receiptId'> & { recurringId?: string | null; bookId?: string };
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface TransactionSearchFilters {
  keyword?: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}
