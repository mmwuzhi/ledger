import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useQueryClient } from '@tanstack/react-query';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  SqliteBookRepository,
  SqliteTagRepository,
  SqliteBudgetRepository,
  SqliteRecurringRepository,
  SqliteSettingsRepository,
  BackupService,
  useOverviewStats,
  DEFAULT_BOOK_SQL,
  DEFAULT_CATEGORIES_SQL,
} from '@moneybook/core';

export default function BackupScreen() {
  const router = useRouter();
  const db = useDb();
  const queryClient = useQueryClient();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const bookRepo = new SqliteBookRepository(db);
  const tagRepo = new SqliteTagRepository(db);
  const budgetRepo = new SqliteBudgetRepository(db);
  const recurringRepo = new SqliteRecurringRepository(db);
  const settingsRepo = new SqliteSettingsRepository(db);

  const backupService = new BackupService(
    transactionRepo,
    categoryRepo,
    bookRepo,
    tagRepo,
    budgetRepo,
    recurringRepo,
    settingsRepo
  );

  const { data: overviewStats } = useOverviewStats(transactionRepo);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await backupService.exportAll();
      const json = JSON.stringify(data, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `moneybook_backup_${dateStr}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share({ url: fileUri, title: '导出备份' });
    } catch (e) {
      Alert.alert('备份失败', '请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert('恢复数据', '恢复将覆盖当前所有数据，确定继续吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '继续',
        style: 'destructive',
        onPress: doImport,
      },
    ]);
  };

  const doImport = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      if (!backupService.validateBackup(data)) {
        Alert.alert('格式错误', '无法识别备份文件格式');
        setImporting(false);
        return;
      }

      // Clear existing data
      await db.execAsync(`
        DELETE FROM transaction_tags;
        DELETE FROM transactions;
        DELETE FROM budgets;
        DELETE FROM recurring_transactions;
        DELETE FROM tags;
        DELETE FROM categories;
        DELETE FROM books;
        DELETE FROM receipts;
        DELETE FROM settings;
      `);

      // Restore books
      for (const b of data.books as any[]) {
        await db.runAsync(
          'INSERT INTO books (id, name, icon, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)',
          [b.id, b.name, b.icon, b.createdAt, b.updatedAt, b.deletedAt ?? null]
        );
      }

      // Restore categories
      for (const c of data.categories as any[]) {
        await db.runAsync(
          'INSERT INTO categories (id, name, icon, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.icon, c.type, c.createdAt, c.updatedAt, c.deletedAt ?? null]
        );
      }

      // Restore tags
      for (const t of data.tags as any[]) {
        await db.runAsync(
          'INSERT INTO tags (id, name, color, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)',
          [t.id, t.name, t.color, t.createdAt, t.updatedAt, t.deletedAt ?? null]
        );
      }

      // Restore recurring
      for (const r of data.recurringTransactions as any[]) {
        await db.runAsync(
          `INSERT INTO recurring_transactions (id, type, amount, category_id, note, frequency, day_of_week, day_of_month, start_date, end_date, last_generated_date, enabled, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id,
            r.type,
            r.amount,
            r.categoryId,
            r.note,
            r.frequency,
            r.dayOfWeek ?? null,
            r.dayOfMonth ?? null,
            r.startDate,
            r.endDate ?? null,
            r.lastGeneratedDate ?? null,
            r.enabled ? 1 : 0,
            r.createdAt,
            r.updatedAt,
            r.deletedAt ?? null,
          ]
        );
      }

      // Restore transactions
      for (const t of data.transactions as any[]) {
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, note, date, receipt_id, recurring_id, book_id, currency, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.type,
            t.amount,
            t.categoryId,
            t.note,
            t.date,
            t.receiptId ?? null,
            t.recurringId ?? null,
            t.bookId ?? 'default',
            t.currency ?? 'CNY',
            t.createdAt,
            t.updatedAt,
            t.deletedAt ?? null,
          ]
        );
      }

      // Restore transaction-tags
      if (data.transactionTags) {
        for (const rel of data.transactionTags as any[]) {
          for (const tagId of rel.tagIds) {
            await db.runAsync(
              'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
              [rel.transactionId, tagId]
            );
          }
        }
      }

      // Restore budgets
      for (const b of data.budgets as any[]) {
        await db.runAsync(
          'INSERT INTO budgets (id, category_id, amount, year, month, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.categoryId ?? null, b.amount, b.year, b.month, b.createdAt, b.updatedAt]
        );
      }

      // Restore settings
      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings as Record<string, unknown>)) {
          if (value !== undefined && value !== null) {
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
              key,
              String(value),
            ]);
          }
        }
      }

      queryClient.invalidateQueries();
      Alert.alert('完成', '数据恢复成功');
    } catch (e) {
      Alert.alert('恢复失败', '文件格式有误或数据损坏');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-4">备份与恢复</Text>
      </View>

      <View className="p-4 gap-4">
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            数据概览
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            共 {overviewStats?.totalRecords ?? 0} 条交易记录
          </Text>
        </View>

        {/* Export */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm gap-3">
          <View>
            <Text className="text-base font-semibold text-gray-900 dark:text-white">备份数据</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              导出所有数据为 JSON 文件，可通过分享保存到任意位置
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-xl py-3.5 items-center ${exporting ? 'bg-primary/60' : 'bg-primary'}`}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">📦 导出备份</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Import */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm gap-3">
          <View>
            <Text className="text-base font-semibold text-gray-900 dark:text-white">恢复数据</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              从备份文件恢复数据，将覆盖当前所有数据
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-xl py-3.5 items-center border-2 ${importing ? 'border-gray-300' : 'border-indigo-500'}`}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#b5693a" />
            ) : (
              <Text className="text-primary text-base font-bold">📥 选择备份文件</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="px-2">
          <Text className="text-xs text-gray-400 leading-5">
            备份包含所有交易、分类、账本、标签、预算、定期记账和设置数据。
            建议定期备份以防数据丢失。
          </Text>
        </View>
      </View>
    </View>
  );
}
