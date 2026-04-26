import { open } from '@op-engineering/op-sqlite';
import React, { createContext, useContext, type ReactNode } from 'react';
import type { IDatabase } from '@moneybook/core';

type OPSQLiteConnection = ReturnType<typeof open>;

/**
 * Wraps @op-engineering/op-sqlite to match the IDatabase interface that all
 * repository implementations expect. When a Turso URL is provided the local
 * SQLite file acts as an embedded replica — reads and writes are local,
 * db.sync() pushes/pulls changes to the cloud.
 */
export class OpSQLiteAdapter implements IDatabase {
  private readonly hasRemote: boolean;

  constructor(
    private readonly db: OPSQLiteConnection,
    hasRemote: boolean
  ) {
    this.hasRemote = hasRemote;
  }

  async getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<T[]> {
    const result = await this.db.executeAsync(sql, params ?? []);
    return (result.rows?._array ?? []) as T[];
  }

  async getFirstAsync<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<T | null> {
    const result = await this.db.executeAsync(sql, params ?? []);
    const arr = result.rows?._array ?? [];
    return arr.length > 0 ? (arr[0] as T) : null;
  }

  async runAsync(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const result = await this.db.executeAsync(sql, params ?? []);
    return {
      lastInsertRowId: result.insertId ?? 0,
      changes: result.rowsAffected ?? 0,
    };
  }

  async execAsync(sql: string): Promise<void> {
    // Strip SQL comments and split into individual statements
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await this.db.executeAsync(stmt);
    }
  }

  /** Push local writes to Turso and pull remote changes. No-op when offline or
   *  when no remote URL is configured. */
  async sync(): Promise<void> {
    if (!this.hasRemote) return;
    await this.db.sync();
  }
}

export function createDb(options: { url: string; authToken: string }): OpSQLiteAdapter {
  if (!options.url) {
    // No remote configured — local-only (useful during development)
    const db = open({ name: 'moneybook' });
    return new OpSQLiteAdapter(db, false);
  }
  const db = open({ name: 'moneybook', url: options.url, authToken: options.authToken });
  return new OpSQLiteAdapter(db, true);
}

// ─── React context ────────────────────────────────────────────────────────────

const DbContext = createContext<OpSQLiteAdapter | null>(null);

export function DbProvider({
  db,
  children,
}: {
  db: OpSQLiteAdapter;
  children: ReactNode;
}) {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb(): OpSQLiteAdapter {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be called inside <DbProvider>');
  return db;
}
