import { Budget, CreateBudgetInput, UpdateBudgetInput } from '../models/budget';

export interface IBudgetRepository {
  findByMonth(year: number, month: number): Promise<Budget[]>;
  findByCategoryAndMonth(
    categoryId: string | null,
    year: number,
    month: number
  ): Promise<Budget | null>;
  create(input: CreateBudgetInput): Promise<Budget>;
  update(id: string, input: UpdateBudgetInput): Promise<Budget>;
  delete(id: string): Promise<void>;
}
