import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  useMonthlyStats,
  useOverviewStats,
  DEFAULT_CATEGORIES_SQL,
} from '@moneybook/core';

function useDependencies() {
  const db = useDb();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  return { db, transactionRepo, categoryRepo };
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { db, transactionRepo } = useDependencies();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: monthlyStats } = useMonthlyStats(transactionRepo, year, month);
  const { data: overviewStats } = useOverviewStats(transactionRepo);

  const handleClearData = () => {
    Alert.alert('清除所有数据', '此操作不可撤销，确定要清除所有账单数据吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认清除',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.execAsync(
              'DELETE FROM transactions; DELETE FROM receipts; DELETE FROM categories;'
            );
            await db.execAsync(DEFAULT_CATEGORIES_SQL);
            queryClient.invalidateQueries();
            Alert.alert('完成', '所有数据已清除');
          } catch (e) {
            Alert.alert('错误', '清除数据失败');
          }
        },
      },
    ]);
  };

  const menuItems = [
    { icon: '📒', label: '账本管理', route: '/settings/books' },
    { icon: '💰', label: '预算管理', route: '/settings/budget' },
    { icon: '🔄', label: '定期记账', route: '/settings/recurring' },
    { icon: '🏷️', label: '标签管理', route: '/settings/tags' },
    { icon: '📂', label: '分类管理', route: '/settings/categories' },
    { icon: '📤', label: '数据导出', route: '/settings/export' },
    { icon: '📦', label: '备份与恢复', route: '/settings/backup' },
    { icon: '💱', label: '货币符号', route: '/settings/currency' },
    { icon: '📝', label: '默认记账类型', route: '/settings/default-type' },
    { icon: '🎨', label: '主题', route: '/settings/theme' },
    { icon: '🔔', label: '提醒设置', route: '/settings/reminders' },
    { icon: '⚡', label: '快捷记账', route: '/settings/quick-add' },
    { icon: '🔒', label: '应用锁', route: '/settings/app-lock' },
  ];

  const futureItems = [{ icon: '🔄', label: '账号与同步' }];

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">我的</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Section 1: Monthly Summary */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {year}年{month}月概览
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-sm text-gray-500">收入</Text>
              <Text className="text-lg font-bold text-income">
                ¥{(monthlyStats?.totalIncome ?? 0).toFixed(2)}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-sm text-gray-500">支出</Text>
              <Text className="text-lg font-bold text-expense">
                ¥{(monthlyStats?.totalExpense ?? 0).toFixed(2)}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-sm text-gray-500">结余</Text>
              <Text className="text-lg font-bold text-gray-900">
                ¥{(monthlyStats?.balance ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Overview Stats */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            记账统计
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">
                {overviewStats?.totalRecords ?? 0}
              </Text>
              <Text className="text-sm text-gray-500">总记录数</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">
                {overviewStats?.daysSinceFirst ?? 0}
              </Text>
              <Text className="text-sm text-gray-500">记账天数</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Menu Items */}
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              }`}
              onPress={() => router.push(item.route as any)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{item.icon}</Text>
                <Text className="text-base text-gray-900 dark:text-white">{item.label}</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 4: Future Features */}
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {futureItems.map((item, index) => (
            <View
              key={item.label}
              className={`flex-row items-center justify-between px-4 py-3.5 opacity-50 ${
                index < futureItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{item.icon}</Text>
                <Text className="text-base text-gray-400">{item.label}</Text>
              </View>
              <View className="bg-gray-200 rounded-full px-2 py-0.5">
                <Text className="text-xs text-gray-500">即将上线</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 5: Danger Zone */}
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <TouchableOpacity
            className="flex-row items-center gap-3 px-4 py-3.5"
            onPress={handleClearData}
          >
            <Text className="text-xl">🗑️</Text>
            <Text className="text-base text-red-500">清除所有数据</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
