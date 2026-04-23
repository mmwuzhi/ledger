import { z } from 'zod';

export const SettingsSchema = z.object({
  currency: z.string().default('¥'),
  defaultTransactionType: z.enum(['income', 'expense']).default('expense'),
  currentBookId: z.string().default('default'),
  appLockEnabled: z.boolean().default(false),
  appLockMethod: z.enum(['biometric', 'pin', 'both']).default('biometric'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().default('21:00'),
  budgetAlertEnabled: z.boolean().default(true),
  budgetAlertThreshold: z.number().min(0).max(100).default(80),
});

export const CURRENCIES = [
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'GBP', symbol: '£', name: '英镑' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'KRW', symbol: '₩', name: '韩元' },
  { code: 'HKD', symbol: 'HK$', name: '港币' },
  { code: 'TWD', symbol: 'NT$', name: '新台币' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export type Settings = z.infer<typeof SettingsSchema>;
