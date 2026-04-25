import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../models';
import { ICategoryRepository } from '../repositories';

function now(): string {
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

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(options?: { includeDeleted?: boolean }): Promise<Category[]> {
    const whereClause = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM categories ${whereClause} ORDER BY name`
    );
    return rows.map(rowToCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return row ? rowToCategory(row) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      'INSERT INTO categories (id, name, icon, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, input.name, input.icon ?? '', input.type, timestamp, timestamp]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.icon !== undefined) {
      fields.push('icon = ?');
      values.push(input.icon);
    }
    if (input.type !== undefined) {
      fields.push('type = ?');
      values.push(input.type);
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync('UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      now(),
      now(),
      id,
    ]);
  }
}
