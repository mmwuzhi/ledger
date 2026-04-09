import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Book, CreateBookInput, UpdateBookInput } from '../models/book';
import { IBookRepository } from '../repositories/IBookRepository';

function rowToBook(row: any): Book {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export class SqliteBookRepository implements IBookRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(): Promise<Book[]> {
    const rows = await this.db.getAllAsync(
      'SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at ASC',
    );
    return rows.map(rowToBook);
  }

  async findById(id: string): Promise<Book | null> {
    const row = await this.db.getFirstAsync(
      'SELECT * FROM books WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return row ? rowToBook(row) : null;
  }

  async create(input: CreateBookInput): Promise<Book> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO books (id, name, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, input.name, input.icon, timestamp, timestamp],
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateBookInput): Promise<Book> {
    const timestamp = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [timestamp];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.icon !== undefined) { fields.push('icon = ?'); values.push(input.icon); }

    values.push(id);
    await this.db.runAsync(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE books SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [timestamp, timestamp, id],
    );
  }
}
