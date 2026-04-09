import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import RecurringScreen from '../app/settings/recurring';
import type { RecurringTransaction, Category } from '@moneybook/core';

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

const mockRecurring: RecurringTransaction[] = [
  {
    id: 'rec-1',
    type: 'expense',
    amount: 2500,
    categoryId: 'cat-housing',
    note: '月租',
    frequency: 'monthly',
    dayOfWeek: null,
    dayOfMonth: 1,
    startDate: '2024-01-01',
    endDate: null,
    lastGeneratedDate: '2026-04-01',
    enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'rec-2',
    type: 'income',
    amount: 15000,
    categoryId: 'cat-salary',
    note: '工资',
    frequency: 'monthly',
    dayOfWeek: null,
    dayOfMonth: 15,
    startDate: '2024-01-01',
    endDate: null,
    lastGeneratedDate: null,
    enabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
  },
];

const mockCategories: Category[] = [
  { id: 'cat-food', name: '餐饮', icon: '🍜', type: 'expense', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'cat-housing', name: '住房', icon: '🏠', type: 'expense', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'cat-salary', name: '薪资', icon: '💰', type: 'income', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
];

jest.mock('@moneybook/core', () => {
  const actual = jest.requireActual('@moneybook/core');
  return {
    ...actual,
    SqliteRecurringRepository: jest.fn(),
    SqliteCategoryRepository: jest.fn(),
    useRecurringTransactions: () => ({ data: mockRecurring }),
    useCategories: () => ({ data: mockCategories }),
    useCreateRecurring: () => ({ mutate: mockCreateMutate }),
    useUpdateRecurring: () => ({ mutate: mockUpdateMutate }),
    useDeleteRecurring: () => ({ mutate: mockDeleteMutate }),
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

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests ---

describe('RecurringScreen', () => {
  it('显示标题和导航', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    expect(getByText('定期记账')).toBeTruthy();
    expect(getByText('← 返回')).toBeTruthy();
    expect(getByText('添加')).toBeTruthy();
  });

  it('点击返回调用 router.back', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('← 返回'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('渲染定期记账列表', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    // 第一条：住房 月租
    expect(getByText('住房')).toBeTruthy();
    expect(getByText('月租')).toBeTruthy();
    expect(getByText('-¥2500.00')).toBeTruthy();

    // 第二条：薪资 工资
    expect(getByText('薪资')).toBeTruthy();
    expect(getByText('工资')).toBeTruthy();
    expect(getByText('+¥15000.00')).toBeTruthy();
  });

  it('显示频率标签', () => {
    const { getAllByText } = renderWithProviders(<RecurringScreen />);
    // rec-1: 每月1日, rec-2: 每月15日
    expect(getAllByText(/每月\d+日/).length).toBe(2);
  });

  it('点击添加打开弹窗', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    expect(getByText('添加定期记账')).toBeTruthy();
    expect(getByPlaceholderText('输入金额')).toBeTruthy();
    // 频率选项
    expect(getByText('每日')).toBeTruthy();
    expect(getByText('每周')).toBeTruthy();
    expect(getByText('每月')).toBeTruthy();
  });

  it('金额为空时保存弹出提示', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.press(getByText('保存'));
    expect(alertSpy).toHaveBeenCalledWith('提示', '请输入有效金额');
  });

  it('金额有效但未选分类时保存弹出提示', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.changeText(getByPlaceholderText('输入金额'), '500');
    fireEvent.press(getByText('保存'));
    expect(alertSpy).toHaveBeenCalledWith('提示', '请选择分类');
  });

  it('填写完整信息后保存调用 createRecurring', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));

    // 填金额
    fireEvent.changeText(getByPlaceholderText('输入金额'), '500');
    // 选分类 (默认 type=expense，所以显示 expense 分类)
    fireEvent.press(getByText('🍜 餐饮'));
    // 保存
    fireEvent.press(getByText('保存'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'expense',
        amount: 500,
        categoryId: 'cat-food',
        frequency: 'monthly',
      }),
      expect.any(Object),
    );
  });

  it('选择每周频率后显示星期几选择器', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.press(getByText('每周'));
    // 应该出现星期几选择
    expect(getByText('星期几')).toBeTruthy();
    expect(getByText('周一')).toBeTruthy();
    expect(getByText('周日')).toBeTruthy();
  });

  it('选择每月频率后显示日期输入', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    // 默认就是 monthly
    expect(getByText('每月几号')).toBeTruthy();
  });

  it('切换收入类型后显示收入分类', () => {
    const { getByText } = renderWithProviders(<RecurringScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.press(getByText('收入'));
    // 收入分类应该出现
    expect(getByText('💰 薪资')).toBeTruthy();
  });

  it('toggle 开关调用 updateRecurring', () => {
    // Switch 组件的 onValueChange
    const { UNSAFE_getAllByType } = renderWithProviders(<RecurringScreen />);
    // 获取所有 Switch
    const { Switch } = require('react-native');
    const switches = UNSAFE_getAllByType(Switch);
    expect(switches.length).toBe(2);

    // 触发第二个 switch（disabled 的那个）
    fireEvent(switches[1], 'onValueChange', true);
    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'rec-2',
      input: { enabled: true },
    });
  });
});
