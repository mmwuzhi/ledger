import { z } from 'zod';

export const SettingsSchema = z.object({
  currency: z.string().default('¥'),
  defaultTransactionType: z.enum(['income', 'expense']).default('expense'),
  currentBookId: z.string().default('default'),
});

export type Settings = z.infer<typeof SettingsSchema>;
