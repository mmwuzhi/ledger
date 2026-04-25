import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionSearchFilters,
} from '../models';
import { ITransactionRepository } from '../repositories';

function now(): string {
  return new Date().toISOString();
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as 'income' | 'expense',
    amount: row.amount as number,
    categoryId: row.category_id as string,
    note: row.note as string,
    date: row.date as string,
    receiptId: (row.receipt_id as string | null) ?? null,
    recurringId: (row.recurring_id as string | null) ?? null,
    bookId: (row.book_id as string) ?? 'default',
    currency: (row.currency as string) ?? 'CNY',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class SqliteTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(options?: { includeDeleted?: boolean }): Promise<Transaction[]> {
    const whereClause = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM transactions ${whereClause} ORDER BY date DESC`
    );
    return rows.map(rowToTransaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return row ? rowToTransaction(row) : null;
  }

  async findByDateRange(from: string, to: string): Promise<Transaction[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date DESC',
      [from, to]
    );
    return rows.map(rowToTransaction);
  }

  async search(filters: TransactionSearchFilters): Promise<Transaction[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.keyword) {
      conditions.push('note LIKE ?');
      params.push(`%${filters.keyword}%`);
    }
    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.categoryId) {
      conditions.push('category_id = ?');
      params.push(filters.categoryId);
    }
    if (filters.dateFrom) {
      conditions.push('date >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('date <= ?');
      params.push(filters.dateTo);
    }
    if (filters.amountMin !== undefined) {
      conditions.push('amount >= ?');
      params.push(filters.amountMin);
    }
    if (filters.amountMax !== undefined) {
      conditions.push('amount <= ?');
      params.push(filters.amountMax);
    }
    if (filters.tagIds && filters.tagIds.length > 0) {
      const placeholders = filters.tagIds.map(() => '?').join(', ');
      conditions.push(
        `id IN (SELECT transaction_id FROM transaction_tags WHERE tag_id IN (${placeholders}))`
      );
      params.push(...filters.tagIds);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM transactions ${whereClause} ORDER BY date DESC`,
      params
    );
    return rows.map(rowToTransaction);
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      `INSERT INTO transactions (id, type, amount, category_id, note, date, receipt_id, recurring_id, book_id, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.type,
        input.amount,
        input.categoryId,
        input.note ?? '',
        input.date,
        input.receiptId ?? null,
        input.recurringId ?? null,
        input.bookId ?? 'default',
        input.currency ?? 'CNY',
        timestamp,
        timestamp,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
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
    if (input.date !== undefined) {
      fields.push('date = ?');
      values.push(input.date);
    }
    if (input.receiptId !== undefined) {
      fields.push('receipt_id = ?');
      values.push(input.receiptId);
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      now(),
      now(),
      id,
    ]);
  }
}
