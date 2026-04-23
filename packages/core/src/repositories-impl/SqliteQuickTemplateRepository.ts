import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import {
  QuickTemplate,
  CreateQuickTemplateInput,
  UpdateQuickTemplateInput,
} from '../models/quick-template';
import { IQuickTemplateRepository } from '../repositories/IQuickTemplateRepository';

function now(): string {
  return new Date().toISOString();
}

function rowToTemplate(row: Record<string, unknown>): QuickTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as 'income' | 'expense',
    amount: row.amount as number,
    categoryId: row.category_id as string,
    note: (row.note as string) ?? '',
    currency: (row.currency as string) ?? 'CNY',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class SqliteQuickTemplateRepository implements IQuickTemplateRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(): Promise<QuickTemplate[]> {
    const rows = await this.db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM quick_templates WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    return rows.map(rowToTemplate);
  }

  async findById(id: string): Promise<QuickTemplate | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM quick_templates WHERE id = ?',
      [id]
    );
    return row ? rowToTemplate(row) : null;
  }

  async create(input: CreateQuickTemplateInput): Promise<QuickTemplate> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      `INSERT INTO quick_templates (id, name, type, amount, category_id, note, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.type,
        input.amount,
        input.categoryId,
        input.note ?? '',
        input.currency ?? 'CNY',
        timestamp,
        timestamp,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateQuickTemplateInput): Promise<QuickTemplate> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
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
    if (input.currency !== undefined) {
      fields.push('currency = ?');
      values.push(input.currency);
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.runAsync(`UPDATE quick_templates SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE quick_templates SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [now(), now(), id]
    );
  }
}
