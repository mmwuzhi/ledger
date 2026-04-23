import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string().default(''), // emoji or icon name
  type: z.enum(['income', 'expense', 'both']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = Pick<Category, 'name' | 'icon' | 'type'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
