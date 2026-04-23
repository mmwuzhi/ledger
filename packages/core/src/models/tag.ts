import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().default('#6366f1'), // indigo as default
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export type Tag = z.infer<typeof TagSchema>;
export type CreateTagInput = Pick<Tag, 'name' | 'color'>;
export type UpdateTagInput = Partial<CreateTagInput>;
