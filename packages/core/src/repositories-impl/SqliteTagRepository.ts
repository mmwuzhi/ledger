import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Tag, CreateTagInput, UpdateTagInput } from '../models/tag';
import { ITagRepository } from '../repositories/ITagRepository';

function rowToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export class SqliteTagRepository implements ITagRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(): Promise<Tag[]> {
    const rows = await this.db.getAllAsync(
      'SELECT * FROM tags WHERE deleted_at IS NULL ORDER BY name ASC'
    );
    return rows.map(rowToTag);
  }

  async findById(id: string): Promise<Tag | null> {
    const row = await this.db.getFirstAsync(
      'SELECT * FROM tags WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return row ? rowToTag(row) : null;
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    await this.db.runAsync(
      'INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, input.name, input.color, timestamp, timestamp]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    const timestamp = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [timestamp];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.color !== undefined) {
      fields.push('color = ?');
      values.push(input.color);
    }

    values.push(id);
    await this.db.runAsync(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.db.runAsync('UPDATE tags SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      timestamp,
      timestamp,
      id,
    ]);
    // Also clean up relationships
    await this.db.runAsync('DELETE FROM transaction_tags WHERE tag_id = ?', [id]);
  }

  async findByTransactionId(transactionId: string): Promise<Tag[]> {
    const rows = await this.db.getAllAsync(
      `SELECT t.* FROM tags t
       INNER JOIN transaction_tags tt ON tt.tag_id = t.id
       WHERE tt.transaction_id = ? AND t.deleted_at IS NULL
       ORDER BY t.name ASC`,
      [transactionId]
    );
    return rows.map(rowToTag);
  }

  async findTransactionIdsByTagId(tagId: string): Promise<string[]> {
    const rows = await this.db.getAllAsync<{ transaction_id: string }>(
      'SELECT transaction_id FROM transaction_tags WHERE tag_id = ?',
      [tagId]
    );
    return rows.map((r) => r.transaction_id);
  }

  async addToTransaction(transactionId: string, tagId: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
      [transactionId, tagId]
    );
  }

  async removeFromTransaction(transactionId: string, tagId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?', [
      transactionId,
      tagId,
    ]);
  }

  async setTransactionTags(transactionId: string, tagIds: string[]): Promise<void> {
    await this.db.runAsync('DELETE FROM transaction_tags WHERE transaction_id = ?', [
      transactionId,
    ]);
    for (const tagId of tagIds) {
      await this.db.runAsync(
        'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
        [transactionId, tagId]
      );
    }
  }
}
