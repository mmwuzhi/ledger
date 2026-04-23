import { CategorySchema } from '../models/category';
import { BudgetSchema } from '../models/budget';
import { RecurringTransactionSchema } from '../models/recurring';
import { ReceiptSchema, OcrResultSchema } from '../models/receipt';
import { TransactionSchema } from '../models/transaction';
import { BookSchema } from '../models/book';
import { TagSchema } from '../models/tag';
import { QuickTemplateSchema } from '../models/quick-template';

describe('CategorySchema', () => {
  const validCategory = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: '餐饮',
    icon: '🍜',
    type: 'expense',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('parses valid category', () => {
    const result = CategorySchema.parse(validCategory);
    expect(result.name).toBe('餐饮');
    expect(result.type).toBe('expense');
    expect(result.deletedAt).toBeNull();
  });

  it('applies default icon', () => {
    const { icon, ...rest } = validCategory;
    const result = CategorySchema.parse(rest);
    expect(result.icon).toBe('');
  });

  it('rejects empty name', () => {
    expect(() => CategorySchema.parse({ ...validCategory, name: '' })).toThrow();
  });

  it('rejects invalid type', () => {
    expect(() => CategorySchema.parse({ ...validCategory, type: 'transfer' })).toThrow();
  });

  it('accepts all valid types', () => {
    for (const type of ['income', 'expense', 'both']) {
      expect(CategorySchema.parse({ ...validCategory, type }).type).toBe(type);
    }
  });
});

describe('BudgetSchema', () => {
  const validBudget = {
    id: 'budget-1',
    categoryId: null,
    amount: 5000,
    year: 2024,
    month: 6,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('parses valid budget', () => {
    const result = BudgetSchema.parse(validBudget);
    expect(result.amount).toBe(5000);
    expect(result.categoryId).toBeNull();
  });

  it('accepts category-specific budget', () => {
    const result = BudgetSchema.parse({ ...validBudget, categoryId: 'cat-1' });
    expect(result.categoryId).toBe('cat-1');
  });

  it('rejects zero amount', () => {
    expect(() => BudgetSchema.parse({ ...validBudget, amount: 0 })).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => BudgetSchema.parse({ ...validBudget, amount: -100 })).toThrow();
  });

  it('rejects month < 1', () => {
    expect(() => BudgetSchema.parse({ ...validBudget, month: 0 })).toThrow();
  });

  it('rejects month > 12', () => {
    expect(() => BudgetSchema.parse({ ...validBudget, month: 13 })).toThrow();
  });
});

describe('RecurringTransactionSchema', () => {
  const valid = {
    id: 'rec-1',
    type: 'expense',
    amount: 100,
    categoryId: 'cat-1',
    frequency: 'monthly',
    startDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('parses valid recurring', () => {
    const result = RecurringTransactionSchema.parse(valid);
    expect(result.frequency).toBe('monthly');
    expect(result.enabled).toBe(true);
    expect(result.note).toBe('');
    expect(result.endDate).toBeNull();
    expect(result.lastGeneratedDate).toBeNull();
  });

  it('rejects invalid frequency', () => {
    expect(() => RecurringTransactionSchema.parse({ ...valid, frequency: 'yearly' })).toThrow();
  });

  it('accepts all frequencies', () => {
    for (const f of ['daily', 'weekly', 'monthly']) {
      expect(RecurringTransactionSchema.parse({ ...valid, frequency: f }).frequency).toBe(f);
    }
  });

  it('dayOfWeek range 0-6', () => {
    expect(RecurringTransactionSchema.parse({ ...valid, dayOfWeek: 0 }).dayOfWeek).toBe(0);
    expect(RecurringTransactionSchema.parse({ ...valid, dayOfWeek: 6 }).dayOfWeek).toBe(6);
    expect(() => RecurringTransactionSchema.parse({ ...valid, dayOfWeek: 7 })).toThrow();
  });

  it('dayOfMonth range 1-31', () => {
    expect(RecurringTransactionSchema.parse({ ...valid, dayOfMonth: 1 }).dayOfMonth).toBe(1);
    expect(RecurringTransactionSchema.parse({ ...valid, dayOfMonth: 31 }).dayOfMonth).toBe(31);
    expect(() => RecurringTransactionSchema.parse({ ...valid, dayOfMonth: 0 })).toThrow();
    expect(() => RecurringTransactionSchema.parse({ ...valid, dayOfMonth: 32 })).toThrow();
  });
});

describe('ReceiptSchema / OcrResultSchema', () => {
  it('parses valid OCR result', () => {
    const result = OcrResultSchema.parse({
      amount: 42.5,
      date: '2024-01-01',
      note: 'lunch',
      rawText: 'some text',
    });
    expect(result.amount).toBe(42.5);
    expect(result.date).toBe('2024-01-01');
  });

  it('OCR result defaults', () => {
    const result = OcrResultSchema.parse({ amount: null, date: null });
    expect(result.note).toBe('');
    expect(result.rawText).toBe('');
  });

  it('parses valid receipt', () => {
    const result = ReceiptSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      imageUri: '/tmp/photo.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    expect(result.imageUri).toBe('/tmp/photo.jpg');
    expect(result.ocrResult).toBeNull();
  });
});

describe('TransactionSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'expense',
    amount: 42,
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    date: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('parses with defaults', () => {
    const result = TransactionSchema.parse(valid);
    expect(result.note).toBe('');
    expect(result.receiptId).toBeNull();
    expect(result.recurringId).toBeNull();
    expect(result.bookId).toBe('default');
    expect(result.currency).toBe('CNY');
    expect(result.deletedAt).toBeNull();
  });

  it('rejects zero amount', () => {
    expect(() => TransactionSchema.parse({ ...valid, amount: 0 })).toThrow();
  });

  it('rejects invalid type', () => {
    expect(() => TransactionSchema.parse({ ...valid, type: 'transfer' })).toThrow();
  });

  it('accepts custom currency', () => {
    const result = TransactionSchema.parse({ ...valid, currency: 'USD' });
    expect(result.currency).toBe('USD');
  });
});

describe('BookSchema', () => {
  const valid = {
    id: 'book-1',
    name: '旅行',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('applies default icon', () => {
    const result = BookSchema.parse(valid);
    expect(result.icon).toBe('📒');
    expect(result.deletedAt).toBeNull();
  });

  it('accepts custom icon', () => {
    const result = BookSchema.parse({ ...valid, icon: '✈️' });
    expect(result.icon).toBe('✈️');
  });
});

describe('TagSchema', () => {
  const valid = {
    id: 'tag-1',
    name: '日常',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('applies default color', () => {
    const result = TagSchema.parse(valid);
    expect(result.color).toBe('#6366f1');
  });

  it('accepts custom color', () => {
    const result = TagSchema.parse({ ...valid, color: '#ff0000' });
    expect(result.color).toBe('#ff0000');
  });
});

describe('QuickTemplateSchema', () => {
  const valid = {
    id: 'qt-1',
    name: '早餐',
    type: 'expense',
    amount: 15,
    categoryId: 'cat-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('parses with defaults', () => {
    const result = QuickTemplateSchema.parse(valid);
    expect(result.note).toBe('');
    expect(result.currency).toBe('CNY');
    expect(result.deletedAt).toBeNull();
  });

  it('rejects empty name', () => {
    expect(() => QuickTemplateSchema.parse({ ...valid, name: '' })).toThrow();
  });

  it('rejects zero amount', () => {
    expect(() => QuickTemplateSchema.parse({ ...valid, amount: 0 })).toThrow();
  });

  it('accepts income type', () => {
    const result = QuickTemplateSchema.parse({ ...valid, type: 'income' });
    expect(result.type).toBe('income');
  });
});
