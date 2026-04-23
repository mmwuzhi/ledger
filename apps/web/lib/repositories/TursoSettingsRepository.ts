import type { Client } from '@libsql/client';
import type { Settings } from '@moneybook/core';
import { SettingsSchema } from '@moneybook/core';
import type { ISettingsRepository } from '@moneybook/core';
import { rowToObject } from '../db';

export class TursoSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: Client) {}

  async get(): Promise<Settings> {
    const result = await this.db.execute('SELECT key, value FROM settings');
    const map: Record<string, string> = {};
    for (const row of result.rows) {
      const r = rowToObject(row, result.columns);
      map[r.key as string] = r.value as string;
    }
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
        await this.db.execute({
          sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          args: [key, String(value)],
        });
      }
    }
    return this.get();
  }
}
