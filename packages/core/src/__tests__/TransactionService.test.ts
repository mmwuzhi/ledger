import { TransactionService } from '../services/TransactionService';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { IReceiptRepository } from '../repositories/IReceiptRepository';
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

function makeMockReceiptRepo(overrides?: Partial<IReceiptRepository>): IReceiptRepository {
  return {
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    updateOcrResult: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('TransactionService', () => {
  describe('createTransaction', () => {
    it('creates a transaction when category exists', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      const result = await service.createTransaction({
        type: 'expense',
        amount: 50,
        categoryId: 'cat-1',
        note: '午餐',
        date: '2024-01-15T12:00:00.000Z',
        receiptId: null,
      });

      expect(txnRepo.create).toHaveBeenCalled();
      expect(result.amount).toBe(50);
    });

    it('throws when category does not exist', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo({ findById: jest.fn().mockResolvedValue(null) });
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      await expect(
        service.createTransaction({
          type: 'expense',
          amount: 50,
          categoryId: 'nonexistent',
          note: '',
          date: '2024-01-15T12:00:00.000Z',
          receiptId: null,
        })
      ).rejects.toThrow('Category nonexistent not found');
    });
  });

  describe('updateTransaction', () => {
    it('updates a transaction', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      const result = await service.updateTransaction('txn-1', { amount: 80 });
      expect(txnRepo.update).toHaveBeenCalledWith('txn-1', { amount: 80 });
      expect(result).toBeDefined();
    });

    it('throws when transaction is deleted', async () => {
      const deleted = { ...mockTransaction, deletedAt: '2024-01-15T13:00:00.000Z' };
      const txnRepo = makeMockTransactionRepo({ findById: jest.fn().mockResolvedValue(deleted) });
      const catRepo = makeMockCategoryRepo();
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      await expect(service.updateTransaction('txn-1', { amount: 80 })).rejects.toThrow();
    });
  });

  describe('deleteTransaction', () => {
    it('soft deletes the transaction', async () => {
      const txnRepo = makeMockTransactionRepo();
      const catRepo = makeMockCategoryRepo();
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      await service.deleteTransaction('txn-1');
      expect(txnRepo.softDelete).toHaveBeenCalledWith('txn-1');
    });

    it('also soft deletes linked receipt', async () => {
      const txnWithReceipt = { ...mockTransaction, receiptId: 'rcpt-1' };
      const txnRepo = makeMockTransactionRepo({
        findById: jest.fn().mockResolvedValue(txnWithReceipt),
      });
      const catRepo = makeMockCategoryRepo();
      const rcptRepo = makeMockReceiptRepo();
      const service = new TransactionService(txnRepo, catRepo, rcptRepo);

      await service.deleteTransaction('txn-1');
      expect(rcptRepo.softDelete).toHaveBeenCalledWith('rcpt-1');
      expect(txnRepo.softDelete).toHaveBeenCalledWith('txn-1');
    });
  });
});
