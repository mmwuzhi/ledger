import type { Client, InArgs } from '@libsql/client';
import type {
  QuickTemplate,
  CreateQuickTemplateInput,
  UpdateQuickTemplateInput,
} from '@moneybook/core';
import type { IQuickTemplateRepository } from '@moneybook/core';
import { rowToObject } from '../db';

function now() {
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

export class TursoQuickTemplateRepository implements IQuickTemplateRepository {
  constructor(private readonly db: Client) {}

  async findAll(): Promise<QuickTemplate[]> {
    const result = await this.db.execute(
      'SELECT * FROM quick_templates WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    return result.rows.map((r) => rowToTemplate(rowToObject(r, result.columns)));
  }

  async findById(id: string): Promise<QuickTemplate | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM quick_templates WHERE id = ?',
      args: [id],
    });
    if (!result.rows[0]) return null;
    return rowToTemplate(rowToObject(result.rows[0], result.columns));
  }

  async create(input: CreateQuickTemplateInput): Promise<QuickTemplate> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db.execute({
      sql: 'INSERT INTO quick_templates (id, name, type, amount, category_id, note, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        id,
        input.name,
        input.type,
        input.amount,
        input.categoryId,
        input.note ?? '',
        input.currency ?? 'CNY',
        ts,
        ts,
      ],
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateQuickTemplateInput): Promise<QuickTemplate> {
    const fields: string[] = ['updated_at = ?'];
    const args: InArgs = [now()];
    if (input.name !== undefined) {
      fields.push('name = ?');
      args.push(input.name);
    }
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
    if (input.currency !== undefined) {
      fields.push('currency = ?');
      args.push(input.currency);
    }
    args.push(id);
    await this.db.execute({
      sql: `UPDATE quick_templates SET ${fields.join(', ')} WHERE id = ?`,
      args,
    });
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const ts = now();
    await this.db.execute({
      sql: 'UPDATE quick_templates SET deleted_at = ?, updated_at = ? WHERE id = ?',
      args: [ts, ts, id],
    });
  }
}
