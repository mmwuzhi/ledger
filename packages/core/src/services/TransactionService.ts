import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { IReceiptRepository } from '../repositories/IReceiptRepository';
import { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../models';

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly receiptRepo: IReceiptRepository,
  ) {}

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new Error(`Category ${input.categoryId} not found`);
    return this.transactionRepo.create(input);
  }

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const existing = await this.transactionRepo.findById(id);
    if (!existing || existing.deletedAt) throw new Error(`Transaction ${id} not found`);
    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) throw new Error(`Category ${input.categoryId} not found`);
    }
    return this.transactionRepo.update(id, input);
  }

  async deleteTransaction(id: string): Promise<void> {
    const existing = await this.transactionRepo.findById(id);
    if (!existing || existing.deletedAt) throw new Error(`Transaction ${id} not found`);
    if (existing.receiptId) {
      await this.receiptRepo.softDelete(existing.receiptId);
    }
    await this.transactionRepo.softDelete(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.findAll();
  }

  async getTransactionsByDateRange(from: string, to: string): Promise<Transaction[]> {
    return this.transactionRepo.findByDateRange(from, to);
  }
}
