import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Budget, CreateBudgetInput, UpdateBudgetInput } from '../models/budget';
import { IBudgetRepository } from '../repositories/IBudgetRepository';

function now(): string {
  return new Date().toISOString();
}

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    categoryId: (row.category_id as string | null) ?? null,
    amount: row.amount as number,
    year: row.year as number,
    month: row.month as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SqliteBudgetRepository implements IBudgetRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findByMonth(year: number, month: number): Promise<Budget[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM budgets WHERE year = ? AND month = ? ORDER BY category_id ASC',
      [year, month]
    );
    return rows.map(rowToBudget);
  }

  async findByCategoryAndMonth(
    categoryId: string | null,
    year: number,
    month: number
  ): Promise<Budget | null> {
    const row =
      categoryId === null
        ? await this.db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM budgets WHERE category_id IS NULL AND year = ? AND month = ?',
            [year, month]
          )
        : await this.db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM budgets WHERE category_id = ? AND year = ? AND month = ?',
            [categoryId, year, month]
          );
    return row ? rowToBudget(row) : null;
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      `INSERT INTO budgets (id, category_id, amount, year, month, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.categoryId ?? null, input.amount, input.year, input.month, timestamp, timestamp]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateBudgetInput): Promise<Budget> {
    await this.db.runAsync('UPDATE budgets SET amount = ?, updated_at = ? WHERE id = ?', [
      input.amount,
      now(),
      id,
    ]);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
  }

  private async findById(id: string): Promise<Budget | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM budgets WHERE id = ?',
      [id]
    );
    return row ? rowToBudget(row) : null;
  }
}
