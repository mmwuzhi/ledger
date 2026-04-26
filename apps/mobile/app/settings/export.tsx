import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  ExportService,
  useOverviewStats,
} from '@moneybook/core';

export default function ExportScreen() {
  const router = useRouter();
  const db = useDb();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const { data: overviewStats } = useOverviewStats(transactionRepo);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const exportService = new ExportService(transactionRepo, categoryRepo);
      const csv = await exportService.exportToCsv();

      const fileUri = FileSystem.documentDirectory + 'moneybook_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share({
        url: fileUri,
        title: '导出账单数据',
      });
    } catch (e) {
      Alert.alert('导出失败', '请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">数据导出</Text>
      </View>

      <View className="p-4 gap-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-2">导出预览</Text>
          <Text className="text-gray-500">
            共 {overviewStats?.totalRecords ?? 0} 条记录将被导出为 CSV 格式
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${exporting ? 'bg-primary/60' : 'bg-primary'}`}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">导出 CSV</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
