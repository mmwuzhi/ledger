import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { IBookRepository } from '../repositories/IBookRepository';
import { ITagRepository } from '../repositories/ITagRepository';
import { IBudgetRepository } from '../repositories/IBudgetRepository';
import { IRecurringRepository } from '../repositories/IRecurringRepository';
import { ISettingsRepository } from '../repositories/ISettingsRepository';

export interface BackupData {
  version: number;
  createdAt: string;
  transactions: unknown[];
  categories: unknown[];
  books: unknown[];
  tags: unknown[];
  budgets: unknown[];
  recurringTransactions: unknown[];
  settings: Record<string, unknown>;
  transactionTags: Array<{ transactionId: string; tagIds: string[] }>;
}

export class BackupService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly bookRepo: IBookRepository,
    private readonly tagRepo: ITagRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly recurringRepo: IRecurringRepository,
    private readonly settingsRepo: ISettingsRepository
  ) {}

  async exportAll(): Promise<BackupData> {
    const [transactions, categories, books, tags, recurringTransactions, settings] =
      await Promise.all([
        this.transactionRepo.findAll({ includeDeleted: true }),
        this.categoryRepo.findAll({ includeDeleted: true }),
        this.bookRepo.findAll(),
        this.tagRepo.findAll(),
        this.recurringRepo.findAll({ includeDeleted: true }),
        this.settingsRepo.get(),
      ]);

    // Gather all current budgets (fetch a wide range)
    const now = new Date();
    const budgetPromises: Promise<unknown[]>[] = [];
    for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        budgetPromises.push(this.budgetRepo.findByMonth(y, m));
      }
    }
    const budgetResults = await Promise.all(budgetPromises);
    const budgets = budgetResults.flat();

    // Gather transaction-tag relationships
    const transactionTags: Array<{ transactionId: string; tagIds: string[] }> = [];
    for (const txn of transactions) {
      const txnTags = await this.tagRepo.findByTransactionId(txn.id);
      if (txnTags.length > 0) {
        transactionTags.push({ transactionId: txn.id, tagIds: txnTags.map((t) => t.id) });
      }
    }

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      transactions,
      categories,
      books,
      tags,
      budgets,
      recurringTransactions,
      settings: settings as unknown as Record<string, unknown>,
      transactionTags,
    };
  }

  validateBackup(data: unknown): data is BackupData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.version === 'number' &&
      Array.isArray(d.transactions) &&
      Array.isArray(d.categories) &&
      typeof d.settings === 'object'
    );
  }
}
