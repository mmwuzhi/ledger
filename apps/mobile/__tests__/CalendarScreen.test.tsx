import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CalendarScreen from '../app/(tabs)/calendar';
import type { CalendarMonthData, Transaction, Category } from '@moneybook/core';

// --- Mocks ---

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCalendarData: CalendarMonthData = {
  year: 2026,
  month: 4,
  days: {
    '2026-04-10': { date: '2026-04-10', totalIncome: 0, totalExpense: 350, transactionCount: 2 },
    '2026-04-11': { date: '2026-04-11', totalIncome: 15000, totalExpense: 0, transactionCount: 1 },
  },
  totalIncome: 15000,
  totalExpense: 350,
};

const mockDayTransactions: Transaction[] = [
  {
    id: 'txn-1', type: 'expense', amount: 200, categoryId: 'cat-food', note: '午餐',
    date: '2026-04-10T12:00:00.000Z', receiptId: null, recurringId: null, bookId: 'default',
    createdAt: '2026-04-10T12:00:00.000Z', updatedAt: '2026-04-10T12:00:00.000Z', deletedAt: null,
  },
  {
    id: 'txn-2', type: 'expense', amount: 150, categoryId: 'cat-transport', note: '打车',
    date: '2026-04-10T18:00:00.000Z', receiptId: null, recurringId: null, bookId: 'default',
    createdAt: '2026-04-10T18:00:00.000Z', updatedAt: '2026-04-10T18:00:00.000Z', deletedAt: null,
  },
];

const mockCategories: Category[] = [
  { id: 'cat-food', name: '餐饮', icon: '🍜', type: 'expense', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'cat-transport', name: '交通', icon: '🚗', type: 'expense', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
];

jest.mock('@moneybook/core', () => {
  const actual = jest.requireActual('@moneybook/core');
  return {
    ...actual,
    SqliteTransactionRepository: jest.fn(),
    SqliteCategoryRepository: jest.fn(),
    useCalendarMonth: () => ({ data: mockCalendarData }),
    useDayTransactions: () => ({ data: mockDayTransactions }),
    useCategories: () => ({ data: mockCategories }),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => jest.clearAllMocks());

// --- Tests ---

describe('CalendarScreen', () => {
  it('显示标题', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    expect(getByText('日历')).toBeTruthy();
  });

  it('显示当前年月', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    const now = new Date();
    expect(getByText(`${now.getFullYear()}年${now.getMonth() + 1}月`)).toBeTruthy();
  });

  it('显示星期标头', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    expect(getByText('日')).toBeTruthy();
    expect(getByText('一')).toBeTruthy();
    expect(getByText('六')).toBeTruthy();
  });

  it('显示月度收支汇总', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    expect(getByText('收入 ¥15000.00')).toBeTruthy();
    expect(getByText('支出 ¥350.00')).toBeTruthy();
  });

  it('渲染日历中的日期数字', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    // 当月应该有 1 号和最后一天
    expect(getByText('1')).toBeTruthy();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    expect(getByText(String(daysInMonth))).toBeTruthy();
  });

  it('选中日期后显示当日交易', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    // 默认选中今天，mock 返回两笔交易
    expect(getByText('餐饮')).toBeTruthy();
    expect(getByText('交通')).toBeTruthy();
    expect(getByText('-¥200.00')).toBeTruthy();
    expect(getByText('-¥150.00')).toBeTruthy();
  });

  it('显示交易备注', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    expect(getByText('午餐')).toBeTruthy();
    expect(getByText('打车')).toBeTruthy();
  });

  it('月份切换可以点击', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    // 点击上一月
    fireEvent.press(getByText('‹'));
    // 点击下一月
    fireEvent.press(getByText('›'));
    // 不崩溃即可
  });

  it('点击交易项跳转到详情', () => {
    const { getByText } = renderWithProviders(<CalendarScreen />);
    fireEvent.press(getByText('餐饮'));
    expect(mockPush).toHaveBeenCalledWith('/transaction/txn-1');
  });
});
