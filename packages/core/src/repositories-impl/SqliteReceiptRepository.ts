import { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { Receipt, OcrResult, CreateReceiptInput } from '../models';
import { IReceiptRepository } from '../repositories';

function now(): string {
  return new Date().toISOString();
}

function rowToReceipt(row: Record<string, unknown>): Receipt {
  return {
    id: row.id as string,
    imageUri: row.image_uri as string,
    ocrResult: row.ocr_result ? JSON.parse(row.ocr_result as string) : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class SqliteReceiptRepository implements IReceiptRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: string): Promise<Receipt | null> {
    const row = await this.db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM receipts WHERE id = ?',
      [id]
    );
    return row ? rowToReceipt(row) : null;
  }

  async create(input: CreateReceiptInput): Promise<Receipt> {
    const id = randomUUID();
    const timestamp = now();
    await this.db.runAsync(
      'INSERT INTO receipts (id, image_uri, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [id, input.imageUri, timestamp, timestamp]
    );
    return (await this.findById(id))!;
  }

  async updateOcrResult(id: string, ocrResult: OcrResult): Promise<Receipt> {
    await this.db.runAsync('UPDATE receipts SET ocr_result = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(ocrResult),
      now(),
      id,
    ]);
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync('UPDATE receipts SET deleted_at = ?, updated_at = ? WHERE id = ?', [
      now(),
      now(),
      id,
    ]);
  }
}
