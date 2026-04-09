import { z } from 'zod';

export const BookSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().default('📒'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Book = z.infer<typeof BookSchema>;
export type CreateBookInput = Pick<Book, 'name' | 'icon'>;
export type UpdateBookInput = Partial<CreateBookInput>;
