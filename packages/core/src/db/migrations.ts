import { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL, DEFAULT_BOOK_SQL, DEFAULT_CATEGORIES_SQL } from './schema';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);
  await db.execAsync(DEFAULT_BOOK_SQL);
  await db.execAsync(DEFAULT_CATEGORIES_SQL);
}
