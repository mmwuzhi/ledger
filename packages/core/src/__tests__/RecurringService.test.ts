import { RecurringService } from '../services/RecurringService';
import { IRecurringRepository } from '../repositories/IRecurringRepository';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { RecurringTransaction } from '../models/recurring';
import { Transaction } from '../models/transaction';

function makeRecurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 'rec-1',
    type: 'expense',
    amount: 100,
    categoryId: 'cat-1',
    note: '月租',
    frequency: 'monthly',
    dayOfWeek: null,
    dayOfMonth: 1,
    startDate: '2024-01-01',
    endDate: null,
    lastGeneratedDate: null,
    enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

const mockTransaction: Transaction = {
  id: 'txn-gen-1',
  type: 'expense',
  amount: 100,
  categoryId: 'cat-1',
  note: '月租',
  date: '2024-01-01T00:00:00.000Z',
  receiptId: null,
  recurringId: 'rec-1',
  bookId: 'default',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

function makeMockRecurringRepo(overrides?: Partial<IRecurringRepository>): IRecurringRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findEnabled: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    updateLastGeneratedDate: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeMockTransactionRepo(overrides?: Partial<ITransactionRepository>): ITransactionRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByDateRange: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(mockTransaction),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('RecurringService', () => {
  describe('getDueDates', () => {
    it('generates dates for every day in range (daily)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-01-05');
      expect(dates).toEqual([
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-05',
      ]);
    });

    it('only generates on correct day of week (weekly)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      // 2024-01-01 is Monday (dayOfWeek=1)
      const r = makeRecurring({
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        startDate: '2024-01-01',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-01-15');
      expect(dates).toEqual([
        '2024-01-01',
        '2024-01-08',
        '2024-01-15',
      ]);
    });

    it('generates on correct day of month (monthly)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: '2024-01-01',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-03-20');
      expect(dates).toEqual([
        '2024-01-15',
        '2024-02-15',
        '2024-03-15',
      ]);
    });

    it('handles months with fewer days (e.g. Feb 28 when dayOfMonth=31)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'monthly',
        dayOfMonth: 31,
        startDate: '2024-01-01',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-04-30');
      expect(dates).toEqual([
        '2024-01-31',
        '2024-02-29', // 2024 is a leap year
        '2024-03-31',
        '2024-04-30', // April has 30 days
      ]);
    });

    it('respects startDate (no dates before start)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-05',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-01-07');
      expect(dates).toEqual([
        '2024-01-05',
        '2024-01-06',
        '2024-01-07',
      ]);
      // No dates before Jan 5
      expect(dates.find(d => d < '2024-01-05')).toBeUndefined();
    });

    it('respects endDate (no dates after end)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        lastGeneratedDate: null,
      });

      const dates = service.getDueDates(r, '2024-01-10');
      expect(dates).toEqual([
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
      ]);
    });

    it('skips if lastGeneratedDate is today (nothing new to generate)', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        lastGeneratedDate: '2024-01-05',
      });

      const dates = service.getDueDates(r, '2024-01-05');
      expect(dates).toEqual([]);
    });

    it('returns empty when today is past endDate', () => {
      const recurringRepo = makeMockRecurringRepo();
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const r = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        lastGeneratedDate: '2024-01-03',
      });

      const dates = service.getDueDates(r, '2024-01-10');
      expect(dates).toEqual([]);
    });
  });

  describe('generateDueTransactions', () => {
    it('creates transactions and updates lastGeneratedDate', async () => {
      const recurring = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        lastGeneratedDate: null,
      });

      const recurringRepo = makeMockRecurringRepo({
        findEnabled: jest.fn().mockResolvedValue([recurring]),
      });
      const txnRepo = makeMockTransactionRepo({
        create: jest.fn().mockResolvedValue(mockTransaction),
      });
      const service = new RecurringService(recurringRepo, txnRepo);

      const generated = await service.generateDueTransactions('2024-01-03');

      expect(generated).toHaveLength(3);
      expect(txnRepo.create).toHaveBeenCalledTimes(3);
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          amount: 100,
          categoryId: 'cat-1',
          recurringId: 'rec-1',
        })
      );
      expect(recurringRepo.updateLastGeneratedDate).toHaveBeenCalledWith('rec-1', '2024-01-03');
    });

    it('does not call updateLastGeneratedDate when no dates are due', async () => {
      const recurring = makeRecurring({
        frequency: 'daily',
        startDate: '2024-01-01',
        lastGeneratedDate: '2024-01-05',
      });

      const recurringRepo = makeMockRecurringRepo({
        findEnabled: jest.fn().mockResolvedValue([recurring]),
      });
      const txnRepo = makeMockTransactionRepo();
      const service = new RecurringService(recurringRepo, txnRepo);

      const generated = await service.generateDueTransactions('2024-01-05');

      expect(generated).toHaveLength(0);
      expect(txnRepo.create).not.toHaveBeenCalled();
      expect(recurringRepo.updateLastGeneratedDate).not.toHaveBeenCalled();
    });
  });
});
