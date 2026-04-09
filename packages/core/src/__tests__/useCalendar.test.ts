import { Transaction } from '../models';
import { computeCalendarMonth } from '../hooks/useCalendar';

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'txn-1',
  type: 'expense',
  amount: 100,
  categoryId: 'cat-1',
  note: '',
  date: '2024-01-15T12:00:00.000Z',
  receiptId: null,
  recurringId: null,
  bookId: 'default',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  deletedAt: null,
  ...overrides,
} as Transaction);

describe('computeCalendarMonth', () => {
  it('returns all zeros for empty transactions', () => {
    const result = computeCalendarMonth([], 2024, 1);
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(Object.keys(result.days)).toHaveLength(0);
  });

  it('aggregates mixed income and expense on the same day', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'income', amount: 5000, date: '2024-01-15T10:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200, date: '2024-01-15T14:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', type: 'expense', amount: 300, date: '2024-01-15T18:00:00.000Z' }),
    ];

    const result = computeCalendarMonth(transactions, 2024, 1);
    const day = result.days['2024-01-15'];

    expect(day.totalIncome).toBe(5000);
    expect(day.totalExpense).toBe(500);
    expect(day.transactionCount).toBe(3);
  });

  it('separates transactions on different days correctly', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'expense', amount: 100, date: '2024-01-10T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200, date: '2024-01-20T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', type: 'income', amount: 500, date: '2024-01-10T08:00:00.000Z' }),
    ];

    const result = computeCalendarMonth(transactions, 2024, 1);

    expect(Object.keys(result.days)).toHaveLength(2);
    expect(result.days['2024-01-10'].totalIncome).toBe(500);
    expect(result.days['2024-01-10'].totalExpense).toBe(100);
    expect(result.days['2024-01-10'].transactionCount).toBe(2);
    expect(result.days['2024-01-20'].totalIncome).toBe(0);
    expect(result.days['2024-01-20'].totalExpense).toBe(200);
    expect(result.days['2024-01-20'].transactionCount).toBe(1);
  });

  it('calculates correct per-day breakdown for multiple days', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'expense', amount: 50, date: '2024-01-05T09:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', type: 'income', amount: 1000, date: '2024-01-05T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', type: 'expense', amount: 80, date: '2024-01-15T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-4', type: 'income', amount: 300, date: '2024-01-25T12:00:00.000Z' }),
    ];

    const result = computeCalendarMonth(transactions, 2024, 1);

    expect(result.days['2024-01-05'].totalIncome).toBe(1000);
    expect(result.days['2024-01-05'].totalExpense).toBe(50);
    expect(result.days['2024-01-15'].totalExpense).toBe(80);
    expect(result.days['2024-01-25'].totalIncome).toBe(300);
  });

  it('month totals match sum of all day totals', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'income', amount: 1000, date: '2024-03-01T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 250, date: '2024-03-01T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', type: 'income', amount: 500, date: '2024-03-15T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-4', type: 'expense', amount: 100, date: '2024-03-15T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-5', type: 'expense', amount: 75, date: '2024-03-28T12:00:00.000Z' }),
    ];

    const result = computeCalendarMonth(transactions, 2024, 3);

    const sumIncome = Object.values(result.days).reduce((s, d) => s + d.totalIncome, 0);
    const sumExpense = Object.values(result.days).reduce((s, d) => s + d.totalExpense, 0);

    expect(result.totalIncome).toBe(sumIncome);
    expect(result.totalExpense).toBe(sumExpense);
    expect(result.totalIncome).toBe(1500);
    expect(result.totalExpense).toBe(425);
  });

  it('transaction count per day is correct', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', date: '2024-02-10T08:00:00.000Z' }),
      makeTransaction({ id: 'txn-2', date: '2024-02-10T12:00:00.000Z' }),
      makeTransaction({ id: 'txn-3', date: '2024-02-10T18:00:00.000Z' }),
      makeTransaction({ id: 'txn-4', date: '2024-02-20T12:00:00.000Z' }),
    ];

    const result = computeCalendarMonth(transactions, 2024, 2);

    expect(result.days['2024-02-10'].transactionCount).toBe(3);
    expect(result.days['2024-02-20'].transactionCount).toBe(1);
  });

  it('filters by bookId when provided', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'expense', amount: 100, date: '2024-01-15T12:00:00.000Z', bookId: 'book-a' } as any),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200, date: '2024-01-15T12:00:00.000Z', bookId: 'book-b' } as any),
      makeTransaction({ id: 'txn-3', type: 'income', amount: 500, date: '2024-01-15T12:00:00.000Z', bookId: 'book-a' } as any),
    ];

    const result = computeCalendarMonth(transactions, 2024, 1, 'book-a');

    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(100);
    expect(result.days['2024-01-15'].transactionCount).toBe(2);
  });

  it('includes all transactions when bookId is not provided', () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', type: 'expense', amount: 100, date: '2024-01-15T12:00:00.000Z', bookId: 'book-a' } as any),
      makeTransaction({ id: 'txn-2', type: 'expense', amount: 200, date: '2024-01-15T12:00:00.000Z', bookId: 'book-b' } as any),
    ];

    const result = computeCalendarMonth(transactions, 2024, 1);

    expect(result.totalExpense).toBe(300);
    expect(result.days['2024-01-15'].transactionCount).toBe(2);
  });
});
