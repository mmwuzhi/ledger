import { Transaction, TransactionSearchFilters } from '../models';

const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    type: 'expense',
    amount: 50,
    categoryId: 'cat-food',
    note: '午餐 麦当劳',
    date: '2024-01-15T12:00:00.000Z',
    receiptId: null,
    recurringId: null,
    bookId: 'default',
    createdAt: '2024-01-15T12:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'txn-2',
    type: 'expense',
    amount: 200,
    categoryId: 'cat-shopping',
    note: '买衣服',
    date: '2024-02-10T14:00:00.000Z',
    receiptId: null,
    recurringId: null,
    bookId: 'default',
    createdAt: '2024-02-10T14:00:00.000Z',
    updatedAt: '2024-02-10T14:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'txn-3',
    type: 'income',
    amount: 10000,
    categoryId: 'cat-salary',
    note: '一月工资',
    date: '2024-01-05T09:00:00.000Z',
    receiptId: null,
    recurringId: null,
    bookId: 'default',
    createdAt: '2024-01-05T09:00:00.000Z',
    updatedAt: '2024-01-05T09:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'txn-4',
    type: 'expense',
    amount: 35,
    categoryId: 'cat-transport',
    note: '打车',
    date: '2024-01-20T18:00:00.000Z',
    receiptId: null,
    recurringId: null,
    bookId: 'default',
    createdAt: '2024-01-20T18:00:00.000Z',
    updatedAt: '2024-01-20T18:00:00.000Z',
    deletedAt: null,
  },
];

// Simulate the same filtering logic as SqliteTransactionRepository.search
function applyFilters(transactions: Transaction[], filters: TransactionSearchFilters): Transaction[] {
  return transactions.filter(t => {
    if (t.deletedAt) return false;
    if (filters.keyword && !t.note.includes(filters.keyword)) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    if (filters.amountMin !== undefined && t.amount < filters.amountMin) return false;
    if (filters.amountMax !== undefined && t.amount > filters.amountMax) return false;
    return true;
  });
}

describe('Transaction search filters', () => {
  it('returns all non-deleted transactions with empty filters', () => {
    const result = applyFilters(mockTransactions, {});
    expect(result).toHaveLength(4);
  });

  it('filters by keyword in note', () => {
    const result = applyFilters(mockTransactions, { keyword: '麦当劳' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn-1');
  });

  it('filters by type', () => {
    const result = applyFilters(mockTransactions, { type: 'income' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn-3');
  });

  it('filters by categoryId', () => {
    const result = applyFilters(mockTransactions, { categoryId: 'cat-food' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn-1');
  });

  it('filters by date range', () => {
    const result = applyFilters(mockTransactions, {
      dateFrom: '2024-01-01T00:00:00.000Z',
      dateTo: '2024-01-31T23:59:59.999Z',
    });
    expect(result).toHaveLength(3);
    expect(result.map(r => r.id).sort()).toEqual(['txn-1', 'txn-3', 'txn-4']);
  });

  it('filters by amount range', () => {
    const result = applyFilters(mockTransactions, { amountMin: 40, amountMax: 200 });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual(['txn-1', 'txn-2']);
  });

  it('filters by amountMin only', () => {
    const result = applyFilters(mockTransactions, { amountMin: 100 });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual(['txn-2', 'txn-3']);
  });

  it('combines multiple filters', () => {
    const result = applyFilters(mockTransactions, {
      type: 'expense',
      amountMin: 30,
      amountMax: 60,
    });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id).sort()).toEqual(['txn-1', 'txn-4']);
  });

  it('returns empty when no match', () => {
    const result = applyFilters(mockTransactions, { keyword: '不存在的关键词' });
    expect(result).toHaveLength(0);
  });

  it('excludes deleted transactions', () => {
    const withDeleted = [...mockTransactions, {
      ...mockTransactions[0],
      id: 'txn-deleted',
      deletedAt: '2024-01-16T00:00:00.000Z',
    }];
    const result = applyFilters(withDeleted, {});
    expect(result).toHaveLength(4);
    expect(result.find(t => t.id === 'txn-deleted')).toBeUndefined();
  });
});
