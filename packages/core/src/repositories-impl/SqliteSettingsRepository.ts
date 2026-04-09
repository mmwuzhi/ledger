import { SQLiteDatabase } from 'expo-sqlite';
import { Settings } from '../models/settings';
import { ISettingsRepository } from '../repositories/ISettingsRepository';

export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(): Promise<Settings> {
    const rows = await this.db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    );
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      currency: map.currency ?? '¥',
      defaultTransactionType: (map.defaultTransactionType as 'income' | 'expense') ?? 'expense',
    };
  }

  async update(settings: Partial<Settings>): Promise<Settings> {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, value]
        );
      }
    }
    return this.get();
  }
}
