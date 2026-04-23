import type { Client, InArgs } from '@libsql/client';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionSearchFilters,
} from '@moneybook/core';
import type { ITransactionRepository } from '@moneybook/core';
import { rowToObject } from '../db';

function now() {
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

export class TursoTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: Client) {}

  async findAll(options?: { includeDeleted?: boolean }): Promise<Transaction[]> {
    const where = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const result = await this.db.execute(`SELECT * FROM transactions ${where} ORDER BY date DESC`);
    return result.rows.map((r) => rowToTransaction(rowToObject(r, result.columns)));
  }

  async findById(id: string): Promise<Transaction | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM transactions WHERE id = ?',
      args: [id],
    });
    if (!result.rows[0]) return null;
    return rowToTransaction(rowToObject(result.rows[0], result.columns));
  }

  async findByDateRange(from: string, to: string): Promise<Transaction[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM transactions WHERE date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date DESC',
      args: [from, to],
    });
    return result.rows.map((r) => rowToTransaction(rowToObject(r, result.columns)));
  }

  async search(filters: TransactionSearchFilters): Promise<Transaction[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const args: InArgs = [];

    if (filters.keyword) {
      conditions.push('note LIKE ?');
      args.push(`%${filters.keyword}%`);
    }
    if (filters.type) {
      conditions.push('type = ?');
      args.push(filters.type);
    }
    if (filters.categoryId) {
      conditions.push('category_id = ?');
      args.push(filters.categoryId);
    }
    if (filters.dateFrom) {
      conditions.push('date >= ?');
      args.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push('date <= ?');
      args.push(filters.dateTo);
    }
    if (filters.amountMin !== undefined) {
      conditions.push('amount >= ?');
      args.push(filters.amountMin);
    }
    if (filters.amountMax !== undefined) {
      conditions.push('amount <= ?');
      args.push(filters.amountMax);
    }
    if (filters.tagIds?.length) {
      conditions.push(
        `id IN (SELECT transaction_id FROM transaction_tags WHERE tag_id IN (${filters.tagIds.map(() => '?').join(',')}))`
      );
      args.push(...filters.tagIds);
    }

    const result = await this.db.execute({
      sql: `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
      args,
    });
    return result.rows.map((r) => rowToTransaction(rowToObject(r, result.columns)));
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db.execute({
      sql: `INSERT INTO transactions (id, type, amount, category_id, note, date, receipt_id, recurring_id, book_id, currency, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
        ts,
        ts,
      ],
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const fields: string[] = ['updated_at = ?'];
    const args: InArgs = [now()];
    if (input.type !== undefined) {
      fields.push('type = ?');
      args.push(input.type);
    }
    if (input.amount !== undefined) {
      fields.push('amount = ?');
      args.push(input.amount);
    }
    if (input.categoryId !== undefined) {
      fields.push('category_id = ?');
      args.push(input.categoryId);
    }
    if (input.note !== undefined) {
      fields.push('note = ?');
      args.push(input.note);
    }
    if (input.date !== undefined) {
      fields.push('date = ?');
      args.push(input.date);
    }
    if (input.receiptId !== undefined) {
      fields.push('receipt_id = ?');
      args.push(input.receiptId);
    }
    args.push(id);
    await this.db.execute({
      sql: `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      args,
    });
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const ts = now();
    await this.db.execute({
      sql: 'UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?',
      args: [ts, ts, id],
    });
  }
}
