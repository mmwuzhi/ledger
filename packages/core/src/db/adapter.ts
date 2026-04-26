/**
 * Minimal database interface shared by the expo-sqlite adapter (dev/legacy)
 * and the op-sqlite + Turso adapter (production sync).
 *
 * Only the three methods that repository implementations actually call.
 */
export interface IDatabase {
  getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<T[]>;

  getFirstAsync<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<T | null>;

  runAsync(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;

  execAsync(sql: string): Promise<void>;
}
