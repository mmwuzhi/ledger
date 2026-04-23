import { useQuery } from '@tanstack/react-query';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { Transaction } from '../models';

export interface CalendarDayData {
  date: string; // 'YYYY-MM-DD'
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  days: Record<string, CalendarDayData>; // key is 'YYYY-MM-DD'
  totalIncome: number;
  totalExpense: number;
}

export const CALENDAR_KEYS = {
  month: (year: number, month: number, bookId?: string) =>
    ['calendar', year, month, bookId] as const,
  day: (date: string, bookId?: string) => ['calendar', 'day', date, bookId] as const,
};

/**
 * Pure computation extracted for testability.
 * Aggregates transactions into per-day calendar data for a given month.
 */
export function computeCalendarMonth(
  transactions: Transaction[],
  year: number,
  month: number,
  bookId?: string
): CalendarMonthData {
  const filtered = bookId ? transactions.filter((t) => (t as any).bookId === bookId) : transactions;

  const days: Record<string, CalendarDayData> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of filtered) {
    const dateKey = t.date.slice(0, 10); // 'YYYY-MM-DD'
    if (!days[dateKey]) {
      days[dateKey] = { date: dateKey, totalIncome: 0, totalExpense: 0, transactionCount: 0 };
    }
    days[dateKey].transactionCount++;
    if (t.type === 'income') {
      days[dateKey].totalIncome += t.amount;
      totalIncome += t.amount;
    } else {
      days[dateKey].totalExpense += t.amount;
      totalExpense += t.amount;
    }
  }

  return { year, month, days, totalIncome, totalExpense };
}

/**
 * Returns aggregated calendar data for every day in a given month.
 */
export function useCalendarMonth(
  transactionRepo: ITransactionRepository,
  year: number,
  month: number,
  bookId?: string
) {
  const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59.999Z`;

  return useQuery({
    queryKey: CALENDAR_KEYS.month(year, month, bookId),
    queryFn: async (): Promise<CalendarMonthData> => {
      const transactions = await transactionRepo.findByDateRange(from, to);
      return computeCalendarMonth(transactions, year, month, bookId);
    },
  });
}

/**
 * Returns transactions for a specific day, optionally filtered by bookId.
 */
export function useDayTransactions(
  transactionRepo: ITransactionRepository,
  date: string, // 'YYYY-MM-DD'
  bookId?: string
) {
  const from = `${date}T00:00:00.000Z`;
  const to = `${date}T23:59:59.999Z`;

  return useQuery({
    queryKey: CALENDAR_KEYS.day(date, bookId),
    queryFn: async () => {
      const transactions = await transactionRepo.findByDateRange(from, to);
      return bookId ? transactions.filter((t) => (t as any).bookId === bookId) : transactions;
    },
  });
}
