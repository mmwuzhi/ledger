import { z } from 'zod';

export const QuickTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string(),
  note: z.string().default(''),
  currency: z.string().default('CNY'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type QuickTemplate = z.infer<typeof QuickTemplateSchema>;
export type CreateQuickTemplateInput = Pick<
  QuickTemplate,
  'name' | 'type' | 'amount' | 'categoryId' | 'note' | 'currency'
>;
export type UpdateQuickTemplateInput = Partial<CreateQuickTemplateInput>;
