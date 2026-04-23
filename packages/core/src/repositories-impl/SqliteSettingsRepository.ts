import { SQLiteDatabase } from 'expo-sqlite';
import { Settings, SettingsSchema } from '../models/settings';
import { ISettingsRepository } from '../repositories/ISettingsRepository';

export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(): Promise<Settings> {
    const rows = await this.db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    );
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Parse booleans stored as 'true'/'false' strings
    const raw: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(map)) {
      if (value === 'true') raw[key] = true;
      else if (value === 'false') raw[key] = false;
      else raw[key] = value;
    }

    return SettingsSchema.parse(raw);
  }

  async update(settings: Partial<Settings>): Promise<Settings> {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        await this.db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          key,
          String(value),
        ]);
      }
    }
    return this.get();
  }
}
