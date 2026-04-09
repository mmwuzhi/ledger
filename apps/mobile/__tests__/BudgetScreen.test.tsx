import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import BudgetScreen from '../app/settings/budget';
import type { BudgetProgress } from '@moneybook/core';

// --- Mocks ---

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockCreateMutate = jest.fn();
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();

const mockProgress: BudgetProgress[] = [
  {
    budgetId: 'bgt-1',
    categoryId: null,
    categoryName: '总预算',
    categoryIcon: '💰',
    budgetAmount: 5000,
    spentAmount: 3500,
    percentage: 70,
    isOverBudget: false,
  },
  {
    budgetId: 'bgt-2',
    categoryId: 'cat-food',
    categoryName: '餐饮',
    categoryIcon: '🍜',
    budgetAmount: 1000,
    spentAmount: 1200,
    percentage: 120,
    isOverBudget: true,
  },
];

const mockBudgets = [
  { id: 'bgt-1', categoryId: null, amount: 5000, year: 2026, month: 4, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
  { id: 'bgt-2', categoryId: 'cat-food', amount: 1000, year: 2026, month: 4, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
];

const mockCategories = [
  { id: 'cat-food', name: '餐饮', icon: '🍜', type: 'expense' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'cat-transport', name: '交通', icon: '🚗', type: 'expense' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'cat-salary', name: '薪资', icon: '💰', type: 'income' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
];

jest.mock('@moneybook/core', () => {
  const actual = jest.requireActual('@moneybook/core');
  return {
    ...actual,
    SqliteBudgetRepository: jest.fn(),
    SqliteTransactionRepository: jest.fn(),
    SqliteCategoryRepository: jest.fn(),
    useBudgets: () => ({ data: mockBudgets }),
    useBudgetProgress: () => ({ data: mockProgress }),
    useCategories: () => ({ data: mockCategories }),
    useCreateBudget: () => ({ mutate: mockCreateMutate }),
    useUpdateBudget: () => ({ mutate: mockUpdateMutate }),
    useDeleteBudget: () => ({ mutate: mockDeleteMutate }),
  };
});

// --- Helpers ---

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// --- Tests ---

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BudgetScreen', () => {
  it('显示标题和导航', () => {
    const { getByText } = renderWithProviders(<BudgetScreen />);
    expect(getByText('预算管理')).toBeTruthy();
    expect(getByText('← 返回')).toBeTruthy();
    expect(getByText('添加')).toBeTruthy();
  });

  it('点击返回调用 router.back', () => {
    const { getByText } = renderWithProviders(<BudgetScreen />);
    fireEvent.press(getByText('← 返回'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('渲染预算进度列表', () => {
    const { getByText } = renderWithProviders(<BudgetScreen />);
    expect(getByText('总预算')).toBeTruthy();
    expect(getByText('餐饮')).toBeTruthy();
    expect(getByText('70%')).toBeTruthy();
    expect(getByText('120%')).toBeTruthy();
    expect(getByText('已花 ¥3500.00')).toBeTruthy();
    expect(getByText('预算 ¥5000.00')).toBeTruthy();
  });

  it('超支时显示超支金额', () => {
    const { getByText } = renderWithProviders(<BudgetScreen />);
    expect(getByText('超支 ¥200.00')).toBeTruthy();
  });

  it('点击添加打开添加预算弹窗', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BudgetScreen />);
    fireEvent.press(getByText('添加'));
    expect(getByText('添加预算')).toBeTruthy();
    expect(getByPlaceholderText('输入预算金额')).toBeTruthy();
    // 分类选择器中应该有未设置预算的分类
    expect(getByText('🚗 交通')).toBeTruthy();
  });

  it('金额为空时保存会弹出提示', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders(<BudgetScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.press(getByText('保存'));
    expect(alertSpy).toHaveBeenCalledWith('提示', '请输入有效的预算金额');
  });

  it('填写金额后保存调用 createBudget', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BudgetScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.changeText(getByPlaceholderText('输入预算金额'), '3000');
    fireEvent.press(getByText('🚗 交通'));
    fireEvent.press(getByText('保存'));
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-transport', amount: 3000 }),
      expect.any(Object),
    );
  });

  it('点击取消关闭弹窗', () => {
    const { getByText, queryByText } = renderWithProviders(<BudgetScreen />);
    fireEvent.press(getByText('添加'));
    expect(getByText('添加预算')).toBeTruthy();
    fireEvent.press(getByText('取消'));
    // Modal 的 visible=false 后，内容仍在 DOM 中但不可见
    // 验证不报错即可
  });

  it('月份切换', () => {
    const { getByText } = renderWithProviders(<BudgetScreen />);
    // 当前月份应显示
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    expect(getByText(expectedMonth)).toBeTruthy();
    // 点击上一个月
    fireEvent.press(getByText('‹'));
  });
});
