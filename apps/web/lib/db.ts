import { createClient, type Client, type Row } from '@libsql/client';
import { CREATE_TABLES_SQL, DEFAULT_BOOK_SQL, DEFAULT_CATEGORIES_SQL } from '@moneybook/core';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL is not set');
    client = createClient({ url, authToken });
  }
  return client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.executeMultiple(CREATE_TABLES_SQL);
  await db.executeMultiple(DEFAULT_BOOK_SQL);
  await db.executeMultiple(DEFAULT_CATEGORIES_SQL);
}

export function rowToObject(row: Row, columns: string[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    const val = row[i];
    obj[col] = typeof val === 'bigint' ? Number(val) : val;
  });
  return obj;
}
