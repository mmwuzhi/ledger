import { BackupService, BackupData } from '../services/BackupService';

const mockTransactions = [
  {
    id: 'txn-1',
    type: 'expense',
    amount: 100,
    categoryId: 'cat-1',
    note: 'lunch',
    date: '2024-01-15T00:00:00.000Z',
    receiptId: null,
    recurringId: null,
    bookId: 'default',
    currency: 'CNY',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    deletedAt: null,
  },
];

const mockCategories = [
  {
    id: 'cat-1',
    name: '餐饮',
    icon: '🍜',
    type: 'expense',
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  },
];

const mockBooks = [
  { id: 'default', name: '默认账本', icon: '📒', createdAt: '', updatedAt: '', deletedAt: null },
];

const mockTags = [
  { id: 'tag-1', name: '日常', color: '#6366f1', createdAt: '', updatedAt: '', deletedAt: null },
];

const mockSettings = {
  currency: '¥',
  defaultTransactionType: 'expense' as const,
  currentBookId: 'default',
  appLockEnabled: false,
  appLockMethod: 'biometric' as const,
  theme: 'system' as const,
};

function createMockRepos() {
  return {
    transactionRepo: {
      findAll: jest.fn().mockResolvedValue(mockTransactions),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    },
    categoryRepo: {
      findAll: jest.fn().mockResolvedValue(mockCategories),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    },
    bookRepo: {
      findAll: jest.fn().mockResolvedValue(mockBooks),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    },
    tagRepo: {
      findAll: jest.fn().mockResolvedValue(mockTags),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findByTransactionId: jest.fn().mockResolvedValue([mockTags[0]]),
      findTransactionIdsByTagId: jest.fn(),
      addToTransaction: jest.fn(),
      removeFromTransaction: jest.fn(),
      setTransactionTags: jest.fn(),
    },
    budgetRepo: {
      findByMonth: jest.fn().mockResolvedValue([]),
      findByCategoryAndMonth: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    recurringRepo: {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findEnabled: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateLastGeneratedDate: jest.fn(),
      softDelete: jest.fn(),
    },
    settingsRepo: {
      get: jest.fn().mockResolvedValue(mockSettings),
      update: jest.fn(),
    },
  };
}

describe('BackupService', () => {
  it('exportAll returns valid backup data', async () => {
    const repos = createMockRepos();
    const service = new BackupService(
      repos.transactionRepo,
      repos.categoryRepo,
      repos.bookRepo,
      repos.tagRepo,
      repos.budgetRepo,
      repos.recurringRepo,
      repos.settingsRepo
    );

    const result = await service.exportAll();

    expect(result.version).toBe(1);
    expect(result.createdAt).toBeDefined();
    expect(result.transactions).toEqual(mockTransactions);
    expect(result.categories).toEqual(mockCategories);
    expect(result.books).toEqual(mockBooks);
    expect(result.tags).toEqual(mockTags);
    expect(result.settings).toEqual(mockSettings);
  });

  it('exportAll includes transaction-tag relationships', async () => {
    const repos = createMockRepos();
    const service = new BackupService(
      repos.transactionRepo,
      repos.categoryRepo,
      repos.bookRepo,
      repos.tagRepo,
      repos.budgetRepo,
      repos.recurringRepo,
      repos.settingsRepo
    );

    const result = await service.exportAll();

    expect(result.transactionTags).toEqual([{ transactionId: 'txn-1', tagIds: ['tag-1'] }]);
  });

  it('validateBackup accepts valid data', () => {
    const repos = createMockRepos();
    const service = new BackupService(
      repos.transactionRepo,
      repos.categoryRepo,
      repos.bookRepo,
      repos.tagRepo,
      repos.budgetRepo,
      repos.recurringRepo,
      repos.settingsRepo
    );

    const validData: BackupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      transactions: [],
      categories: [],
      books: [],
      tags: [],
      budgets: [],
      recurringTransactions: [],
      settings: {},
      transactionTags: [],
    };

    expect(service.validateBackup(validData)).toBe(true);
  });

  it('validateBackup rejects null', () => {
    const repos = createMockRepos();
    const service = new BackupService(
      repos.transactionRepo,
      repos.categoryRepo,
      repos.bookRepo,
      repos.tagRepo,
      repos.budgetRepo,
      repos.recurringRepo,
      repos.settingsRepo
    );

    expect(service.validateBackup(null)).toBe(false);
  });

  it('validateBackup rejects missing fields', () => {
    const repos = createMockRepos();
    const service = new BackupService(
      repos.transactionRepo,
      repos.categoryRepo,
      repos.bookRepo,
      repos.tagRepo,
      repos.budgetRepo,
      repos.recurringRepo,
      repos.settingsRepo
    );

    expect(service.validateBackup({ version: 1 })).toBe(false);
    expect(service.validateBackup({ transactions: [] })).toBe(false);
  });
});
