import type { Client } from '@libsql/client';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@moneybook/core';
import type { IBudgetRepository } from '@moneybook/core';
import { rowToObject } from '../db';

function now() {
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

export class TursoBudgetRepository implements IBudgetRepository {
  constructor(private readonly db: Client) {}

  async findByMonth(year: number, month: number): Promise<Budget[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM budgets WHERE year = ? AND month = ? ORDER BY category_id ASC',
      args: [year, month],
    });
    return result.rows.map((r) => rowToBudget(rowToObject(r, result.columns)));
  }

  async findByCategoryAndMonth(
    categoryId: string | null,
    year: number,
    month: number
  ): Promise<Budget | null> {
    const result =
      categoryId === null
        ? await this.db.execute({
            sql: 'SELECT * FROM budgets WHERE category_id IS NULL AND year = ? AND month = ?',
            args: [year, month],
          })
        : await this.db.execute({
            sql: 'SELECT * FROM budgets WHERE category_id = ? AND year = ? AND month = ?',
            args: [categoryId, year, month],
          });
    if (!result.rows[0]) return null;
    return rowToBudget(rowToObject(result.rows[0], result.columns));
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db.execute({
      sql: 'INSERT INTO budgets (id, category_id, amount, year, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, input.categoryId ?? null, input.amount, input.year, input.month, ts, ts],
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateBudgetInput): Promise<Budget> {
    await this.db.execute({
      sql: 'UPDATE budgets SET amount = ?, updated_at = ? WHERE id = ?',
      args: [input.amount, now(), id],
    });
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute({ sql: 'DELETE FROM budgets WHERE id = ?', args: [id] });
  }

  private async findById(id: string): Promise<Budget | null> {
    const result = await this.db.execute({ sql: 'SELECT * FROM budgets WHERE id = ?', args: [id] });
    if (!result.rows[0]) return null;
    return rowToBudget(rowToObject(result.rows[0], result.columns));
  }
}
