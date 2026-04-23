import { ExportService } from '../services/ExportService';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { Transaction, Category } from '../models';

const mockCategory: Category = {
  id: 'cat-1',
  name: '餐饮',
  icon: '🍜',
  type: 'expense',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const mockIncomeCategory: Category = {
  id: 'cat-2',
  name: '工资',
  icon: '💰',
  type: 'income',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

const mockTransaction: Transaction = {
  id: 'txn-1',
  type: 'expense',
  amount: 50,
  categoryId: 'cat-1',
  note: '午餐',
  date: '2024-01-15T12:00:00.000Z',
  receiptId: null,
  recurringId: null,
  bookId: 'default',
  currency: 'CNY',
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  deletedAt: null,
};

const mockIncomeTransaction: Transaction = {
  id: 'txn-2',
  type: 'income',
  amount: 10000,
  categoryId: 'cat-2',
  note: '月薪',
  date: '2024-01-01T09:00:00.000Z',
  receiptId: null,
  recurringId: null,
  bookId: 'default',
  currency: 'CNY',
  createdAt: '2024-01-01T09:00:00.000Z',
  updatedAt: '2024-01-01T09:00:00.000Z',
  deletedAt: null,
};

function makeMockTransactionRepo(
  overrides?: Partial<ITransactionRepository>
): ITransactionRepository {
  return {
    findAll: jest.fn().mockResolvedValue([mockTransaction]),
    findById: jest.fn().mockResolvedValue(mockTransaction),
    findByDateRange: jest.fn().mockResolvedValue([mockTransaction]),
    search: jest.fn().mockResolvedValue([mockTransaction]),
    create: jest.fn().mockResolvedValue(mockTransaction),
    update: jest.fn().mockResolvedValue(mockTransaction),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeMockCategoryRepo(overrides?: Partial<ICategoryRepository>): ICategoryRepository {
  return {
    findAll: jest.fn().mockResolvedValue([mockCategory]),
    findById: jest.fn().mockResolvedValue(mockCategory),
    create: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue(mockCategory),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ExportService', () => {
  describe('exportToCsv', () => {
    it('exports correct CSV header', async () => {
      const txnRepo = makeMockTransactionRepo({ findAll: jest.fn().mockResolvedValue([]) });
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const header = csv.split('\n')[0];
      expect(header).toBe('日期,类型,分类,金额,备注');
    });

    it('formats expense transactions correctly', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toContain('支出');
    });

    it('formats income transactions correctly', async () => {
      const txnRepo = makeMockTransactionRepo({
        findAll: jest.fn().mockResolvedValue([mockIncomeTransaction]),
      });
      const catRepo = makeMockCategoryRepo({
        findAll: jest.fn().mockResolvedValue([mockIncomeCategory]),
      });
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toContain('收入');
    });

    it('maps category IDs to category names', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toContain('餐饮');
    });

    it('handles unknown category IDs gracefully', async () => {
      const unknownCatTransaction: Transaction = {
        ...mockTransaction,
        categoryId: 'nonexistent-cat',
      };
      const txnRepo = makeMockTransactionRepo({
        findAll: jest.fn().mockResolvedValue([unknownCatTransaction]),
      });
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toContain('未知');
    });

    it('replaces commas in notes with Chinese comma', async () => {
      const txnWithComma: Transaction = {
        ...mockTransaction,
        note: '午餐,晚餐,零食',
      };
      const txnRepo = makeMockTransactionRepo({
        findAll: jest.fn().mockResolvedValue([txnWithComma]),
      });
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toContain('午餐，晚餐，零食');
      expect(rows[1]).not.toMatch(/午餐,/);
    });

    it('returns only header when no transactions exist', async () => {
      const txnRepo = makeMockTransactionRepo({
        findAll: jest.fn().mockResolvedValue([]),
      });
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      expect(csv).toBe('日期,类型,分类,金额,备注');
    });

    it('handles multiple transactions in correct order', async () => {
      const txnRepo = makeMockTransactionRepo({
        findAll: jest.fn().mockResolvedValue([mockTransaction, mockIncomeTransaction]),
      });
      const catRepo = makeMockCategoryRepo({
        findAll: jest.fn().mockResolvedValue([mockCategory, mockIncomeCategory]),
      });
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows).toHaveLength(3); // header + 2 rows
      expect(rows[1]).toContain('支出');
      expect(rows[2]).toContain('收入');
    });

    it('uses date sliced to first 10 chars (YYYY-MM-DD)', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const service = new ExportService(txnRepo, catRepo);

      const csv = await service.exportToCsv();
      const rows = csv.split('\n');
      expect(rows[1]).toMatch(/^2024-01-15,/);
    });
  });
});
