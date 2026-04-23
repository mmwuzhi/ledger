import type { Client, InArgs } from '@libsql/client';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@moneybook/core';
import type { ICategoryRepository } from '@moneybook/core';
import { rowToObject } from '../db';

function now() {
  return new Date().toISOString();
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    type: row.type as 'income' | 'expense' | 'both',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class TursoCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: Client) {}

  async findAll(options?: { includeDeleted?: boolean }): Promise<Category[]> {
    const where = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const result = await this.db.execute(`SELECT * FROM categories ${where} ORDER BY name`);
    return result.rows.map((r) => rowToCategory(rowToObject(r, result.columns)));
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [id],
    });
    if (!result.rows[0]) return null;
    return rowToCategory(rowToObject(result.rows[0], result.columns));
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db.execute({
      sql: 'INSERT INTO categories (id, name, icon, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, input.name, input.icon ?? '', input.type, ts, ts],
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const fields: string[] = ['updated_at = ?'];
    const args: InArgs = [now()];
    if (input.name !== undefined) {
      fields.push('name = ?');
      args.push(input.name);
    }
    if (input.icon !== undefined) {
      fields.push('icon = ?');
      args.push(input.icon);
    }
    if (input.type !== undefined) {
      fields.push('type = ?');
      args.push(input.type);
    }
    args.push(id);
    await this.db.execute({ sql: `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, args });
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const ts = now();
    await this.db.execute({
      sql: 'UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ?',
      args: [ts, ts, id],
    });
  }
}
