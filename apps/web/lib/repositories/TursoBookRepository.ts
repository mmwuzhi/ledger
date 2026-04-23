import type { Client, InArgs } from '@libsql/client';
import type { Book, CreateBookInput, UpdateBookInput } from '@moneybook/core';
import type { IBookRepository } from '@moneybook/core';
import { rowToObject } from '../db';

function now() {
  return new Date().toISOString();
}

function rowToBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class TursoBookRepository implements IBookRepository {
  constructor(private readonly db: Client) {}

  async findAll(): Promise<Book[]> {
    const result = await this.db.execute(
      'SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at ASC'
    );
    return result.rows.map((r) => rowToBook(rowToObject(r, result.columns)));
  }

  async findById(id: string): Promise<Book | null> {
    const result = await this.db.execute({ sql: 'SELECT * FROM books WHERE id = ?', args: [id] });
    if (!result.rows[0]) return null;
    return rowToBook(rowToObject(result.rows[0], result.columns));
  }

  async create(input: CreateBookInput): Promise<Book> {
    const id = crypto.randomUUID();
    const ts = now();
    await this.db.execute({
      sql: 'INSERT INTO books (id, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, input.name, input.icon, ts, ts],
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateBookInput): Promise<Book> {
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
    args.push(id);
    await this.db.execute({ sql: `UPDATE books SET ${fields.join(', ')} WHERE id = ?`, args });
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const ts = now();
    await this.db.execute({
      sql: 'UPDATE books SET deleted_at = ?, updated_at = ? WHERE id = ?',
      args: [ts, ts, id],
    });
  }
}
