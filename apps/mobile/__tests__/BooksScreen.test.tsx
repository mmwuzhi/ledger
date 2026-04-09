import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import BooksScreen from '../app/settings/books';
import type { Book } from '@moneybook/core';

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
const mockUpdateSettingsMutate = jest.fn();

const mockBooks: Book[] = [
  { id: 'default', name: '默认账本', icon: '📒', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: 'book-travel', name: '旅行账本', icon: '✈️', createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z', deletedAt: null },
];

jest.mock('@moneybook/core', () => {
  const actual = jest.requireActual('@moneybook/core');
  return {
    ...actual,
    SqliteBookRepository: jest.fn(),
    SqliteSettingsRepository: jest.fn(),
    useBooks: () => ({ data: mockBooks }),
    useSettings: () => ({ data: { currency: '¥', defaultTransactionType: 'expense', currentBookId: 'default' } }),
    useCreateBook: () => ({ mutate: mockCreateMutate }),
    useUpdateBook: () => ({ mutate: mockUpdateMutate }),
    useDeleteBook: () => ({ mutate: mockDeleteMutate }),
    useUpdateSettings: () => ({ mutate: mockUpdateSettingsMutate }),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => jest.clearAllMocks());

// --- Tests ---

describe('BooksScreen', () => {
  it('显示标题和导航', () => {
    const { getByText } = renderWithProviders(<BooksScreen />);
    expect(getByText('账本管理')).toBeTruthy();
    expect(getByText('← 返回')).toBeTruthy();
    expect(getByText('添加')).toBeTruthy();
  });

  it('渲染账本列表', () => {
    const { getByText } = renderWithProviders(<BooksScreen />);
    expect(getByText('默认账本')).toBeTruthy();
    expect(getByText('旅行账本')).toBeTruthy();
  });

  it('当前账本显示标记', () => {
    const { getByText } = renderWithProviders(<BooksScreen />);
    expect(getByText('当前使用')).toBeTruthy();
  });

  it('点击账本切换当前账本', () => {
    const { getByText } = renderWithProviders(<BooksScreen />);
    fireEvent.press(getByText('旅行账本'));
    expect(mockUpdateSettingsMutate).toHaveBeenCalledWith({ currentBookId: 'book-travel' });
  });

  it('点击添加打开弹窗', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BooksScreen />);
    fireEvent.press(getByText('添加'));
    expect(getByText('新建账本')).toBeTruthy();
    expect(getByPlaceholderText('输入账本名称')).toBeTruthy();
  });

  it('名称为空保存弹提示', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders(<BooksScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.press(getByText('保存'));
    expect(alertSpy).toHaveBeenCalledWith('提示', '请输入账本名称');
  });

  it('填写名称后保存调用 createBook', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BooksScreen />);
    fireEvent.press(getByText('添加'));
    fireEvent.changeText(getByPlaceholderText('输入账本名称'), '日常开销');
    fireEvent.press(getByText('保存'));
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: '日常开销' }),
      expect.any(Object),
    );
  });

  it('默认账本不能删除', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getAllByText } = renderWithProviders(<BooksScreen />);
    // 只有非默认账本有删除按钮
    const deleteButtons = getAllByText('删除');
    expect(deleteButtons.length).toBe(1); // 只有旅行账本有删除
  });
});
