import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionSearchFilters,
} from '../models';

export interface ITransactionRepository {
  findAll(options?: { includeDeleted?: boolean }): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  findByDateRange(from: string, to: string): Promise<Transaction[]>;
  search(filters: TransactionSearchFilters): Promise<Transaction[]>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  softDelete(id: string): Promise<void>;
}
