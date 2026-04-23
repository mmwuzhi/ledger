import {
  RecurringTransaction,
  CreateRecurringInput,
  UpdateRecurringInput,
} from '../models/recurring';

export interface IRecurringRepository {
  findAll(options?: { includeDeleted?: boolean }): Promise<RecurringTransaction[]>;
  findById(id: string): Promise<RecurringTransaction | null>;
  findEnabled(): Promise<RecurringTransaction[]>;
  create(input: CreateRecurringInput): Promise<RecurringTransaction>;
  update(id: string, input: UpdateRecurringInput): Promise<RecurringTransaction>;
  updateLastGeneratedDate(id: string, date: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
