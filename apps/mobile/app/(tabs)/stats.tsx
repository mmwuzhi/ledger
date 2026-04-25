import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { CartesianChart, Bar, Pie, PolarChart } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  useMonthlyStats,
  useCategoryBreakdown,
  useMonthlyTrend,
  useCategories,
} from '@moneybook/core';

const SCREEN_WIDTH = Dimensions.get('window').width;

function useDependencies() {
  const db = useSQLiteContext();
  return {
    transactionRepo: new SqliteTransactionRepository(db),
    categoryRepo: new SqliteCategoryRepository(db),
  };
}

export default function StatsScreen() {
  const { transactionRepo, categoryRepo } = useDependencies();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>('expense');

  const { data: monthlyStats } = useMonthlyStats(transactionRepo, selectedYear, selectedMonth);
  const { data: breakdown = [] } = useCategoryBreakdown(
    transactionRepo,
    categoryRepo,
    selectedYear,
    selectedMonth,
    breakdownType
  );
  const { data: trend = [] } = useMonthlyTrend(transactionRepo, 6);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const pieData = breakdown.map((b) => ({
    value: b.amount,
    color: b.color,
    label: b.categoryName,
  }));

  const barData = trend.map((t) => ({
    month: t.label,
    income: t.income,
    expense: t.expense,
  }));

  return (
    <ScrollView className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">统计</Text>
      </View>

      {/* Month selector */}
      <View className="flex-row items-center justify-center py-3 gap-6">
        <TouchableOpacity onPress={goToPrevMonth}>
          <Text className="text-xl text-primary">◀</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {selectedYear}年{selectedMonth}月
        </Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text className="text-xl text-primary">▶</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly summary cards */}
      <View className="px-4 flex-row gap-2 mb-4">
        <View className="flex-1 bg-white rounded-xl p-3 items-center">
          <Text className="text-xs text-gray-500 mb-1">支出</Text>
          <Text className="text-lg font-bold text-expense">
            ¥{(monthlyStats?.totalExpense ?? 0).toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-3 items-center">
          <Text className="text-xs text-gray-500 mb-1">收入</Text>
          <Text className="text-lg font-bold text-income">
            ¥{(monthlyStats?.totalIncome ?? 0).toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-3 items-center">
          <Text className="text-xs text-gray-500 mb-1">结余</Text>
          <Text
            className={`text-lg font-bold ${(monthlyStats?.balance ?? 0) >= 0 ? 'text-income' : 'text-expense'}`}
          >
            ¥{(monthlyStats?.balance ?? 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Category breakdown */}
      <View className="px-4 mb-4">
        <View className="bg-white rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-gray-900">分类占比</Text>
            <View className="flex-row bg-gray-100 rounded-lg p-0.5">
              <TouchableOpacity
                className={`px-3 py-1 rounded-md ${breakdownType === 'expense' ? 'bg-expense' : ''}`}
                onPress={() => setBreakdownType('expense')}
              >
                <Text
                  className={`text-xs ${breakdownType === 'expense' ? 'text-white' : 'text-gray-600'}`}
                >
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-3 py-1 rounded-md ${breakdownType === 'income' ? 'bg-income' : ''}`}
                onPress={() => setBreakdownType('income')}
              >
                <Text
                  className={`text-xs ${breakdownType === 'income' ? 'text-white' : 'text-gray-600'}`}
                >
                  收入
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {pieData.length > 0 ? (
            <>
              <View style={{ height: 200 }}>
                <PolarChart data={pieData} labelKey="label" valueKey="value" colorKey="color">
                  <Pie.Chart />
                </PolarChart>
              </View>

              {/* Legend */}
              <View className="mt-3 gap-2">
                {breakdown.map((b) => (
                  <View key={b.categoryId} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: b.color }}
                      />
                      <Text className="text-sm text-gray-700">
                        {b.categoryIcon} {b.categoryName}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-gray-900">
                        ¥{b.amount.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-500">{b.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-400">暂无数据</Text>
            </View>
          )}
        </View>
      </View>

      {/* Monthly trend bar chart */}
      <View className="px-4 mb-8">
        <View className="bg-white rounded-xl p-4">
          <Text className="font-bold text-gray-900 mb-3">近6个月趋势</Text>

          {barData.some((d) => d.income > 0 || d.expense > 0) ? (
            <View style={{ height: 220 }}>
              <CartesianChart
                data={barData}
                xKey="month"
                yKeys={['income', 'expense']}
                domainPadding={{ left: 30, right: 30 }}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Bar
                      points={points.income}
                      chartBounds={chartBounds}
                      color="#22c55e"
                      roundedCorners={{ topLeft: 4, topRight: 4 }}
                      barWidth={12}
                      barGap={2}
                    />
                    <Bar
                      points={points.expense}
                      chartBounds={chartBounds}
                      color="#ef4444"
                      roundedCorners={{ topLeft: 4, topRight: 4 }}
                      barWidth={12}
                      barGap={2}
                    />
                  </>
                )}
              </CartesianChart>
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-400">暂无数据</Text>
            </View>
          )}

          {/* Legend */}
          <View className="flex-row justify-center gap-6 mt-2">
            <View className="flex-row items-center gap-1">
              <View
                style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#22c55e' }}
              />
              <Text className="text-xs text-gray-500">收入</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View
                style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#ef4444' }}
              />
              <Text className="text-xs text-gray-500">支出</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
