import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import {
  RecurringTransaction,
  CreateRecurringInput,
  UpdateRecurringInput,
} from '../models/recurring';
import { IRecurringRepository } from '../repositories/IRecurringRepository';

function now(): string {
  return new Date().toISOString();
}

function rowToRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    id: row.id as string,
    type: row.type as 'income' | 'expense',
    amount: row.amount as number,
    categoryId: row.category_id as string,
    note: row.note as string,
    frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
    dayOfWeek: (row.day_of_week as number | null) ?? null,
    dayOfMonth: (row.day_of_month as number | null) ?? null,
    startDate: row.start_date as string,
    endDate: (row.end_date as string | null) ?? null,
    lastGeneratedDate: (row.last_generated_date as string | null) ?? null,
    enabled: !!(row.enabled as number),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class SqliteRecurringRepository implements IRecurringRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(options?: { includeDeleted?: boolean }): Promise<RecurringTransaction[]> {
    const whereClause = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM recurring_transactions ${whereClause} ORDER BY created_at DESC`
    );
    return rows.map(rowToRecurring);
  }

  async findById(id: string): Promise<RecurringTransaction | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM recurring_transactions WHERE id = ?',
      [id]
    );
    return row ? rowToRecurring(row) : null;
  }

  async findEnabled(): Promise<RecurringTransaction[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM recurring_transactions WHERE enabled = 1 AND deleted_at IS NULL'
    );
    return rows.map(rowToRecurring);
  }

  async create(input: CreateRecurringInput): Promise<RecurringTransaction> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      `INSERT INTO recurring_transactions (id, type, amount, category_id, note, frequency, day_of_week, day_of_month, start_date, end_date, last_generated_date, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.type,
        input.amount,
        input.categoryId,
        input.note ?? '',
        input.frequency,
        input.dayOfWeek ?? null,
        input.dayOfMonth ?? null,
        input.startDate,
        input.endDate ?? null,
        null,
        1,
        timestamp,
        timestamp,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateRecurringInput): Promise<RecurringTransaction> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.type !== undefined) {
      fields.push('type = ?');
      values.push(input.type);
    }
    if (input.amount !== undefined) {
      fields.push('amount = ?');
      values.push(input.amount);
    }
    if (input.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(input.categoryId);
    }
    if (input.note !== undefined) {
      fields.push('note = ?');
      values.push(input.note);
    }
    if (input.frequency !== undefined) {
      fields.push('frequency = ?');
      values.push(input.frequency);
    }
    if (input.dayOfWeek !== undefined) {
      fields.push('day_of_week = ?');
      values.push(input.dayOfWeek);
    }
    if (input.dayOfMonth !== undefined) {
      fields.push('day_of_month = ?');
      values.push(input.dayOfMonth);
    }
    if (input.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(input.startDate);
    }
    if (input.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(input.endDate);
    }
    if (input.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(input.enabled ? 1 : 0);
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.runAsync(
      `UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return (await this.findById(id))!;
  }

  async updateLastGeneratedDate(id: string, date: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE recurring_transactions SET last_generated_date = ?, updated_at = ? WHERE id = ?',
      [date, now(), id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE recurring_transactions SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now(), now(), id]
    );
  }
}
