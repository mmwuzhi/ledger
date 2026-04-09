import { SettingsSchema } from '../models/settings';

describe('SettingsSchema', () => {
  it('parses valid settings correctly', () => {
    const input = { currency: '$', defaultTransactionType: 'income' };
    const result = SettingsSchema.parse(input);
    expect(result.currency).toBe('$');
    expect(result.defaultTransactionType).toBe('income');
  });

  it('applies default currency when missing', () => {
    const result = SettingsSchema.parse({});
    expect(result.currency).toBe('¥');
  });

  it('applies default defaultTransactionType when missing', () => {
    const result = SettingsSchema.parse({});
    expect(result.defaultTransactionType).toBe('expense');
  });

  it('applies all defaults for empty object', () => {
    const result = SettingsSchema.parse({});
    expect(result).toEqual({
      currency: '¥',
      defaultTransactionType: 'expense',
      currentBookId: 'default',
    });
  });

  it('rejects invalid defaultTransactionType values', () => {
    expect(() =>
      SettingsSchema.parse({ defaultTransactionType: 'transfer' })
    ).toThrow();
  });
});
