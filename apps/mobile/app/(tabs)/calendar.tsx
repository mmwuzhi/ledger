import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  useCalendarMonth,
  useDayTransactions,
  useCategories,
  CalendarDayData,
} from '@moneybook/core';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export default function CalendarScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().slice(0, 10));

  const { data: calendarData } = useCalendarMonth(transactionRepo, year, month);
  const { data: dayTransactions = [] } = useDayTransactions(
    transactionRepo,
    selectedDate ?? now.toISOString().slice(0, 10)
  );
  const { data: categories = [] } = useCategories(categoryRepo);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  const navigateMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDate(null);
  };

  const getDateKey = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayData = (day: number): CalendarDayData | undefined =>
    calendarData?.days[getDateKey(day)];

  const isToday = (day: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return getDateKey(day) === todayStr;
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-2 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-2">日历</Text>

        {/* Month navigation */}
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => navigateMonth(-1)} className="px-3 py-1">
            <Text className="text-primary text-lg">‹</Text>
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900">
            {year}年{month}月
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} className="px-3 py-1">
            <Text className="text-primary text-lg">›</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly summary */}
        <View className="flex-row justify-around mb-2">
          <Text className="text-sm text-income">
            收入 ¥{(calendarData?.totalIncome ?? 0).toFixed(2)}
          </Text>
          <Text className="text-sm text-expense">
            支出 ¥{(calendarData?.totalExpense ?? 0).toFixed(2)}
          </Text>
          <Text className="text-sm text-gray-600">
            结余 ¥
            {((calendarData?.totalIncome ?? 0) - (calendarData?.totalExpense ?? 0)).toFixed(2)}
          </Text>
        </View>

        {/* Weekday headers */}
        <View className="flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} className="flex-1 items-center py-1">
              <Text className="text-xs text-gray-400">{label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              if (day === null) {
                return <View key={`e-${di}`} className="flex-1 py-1" />;
              }
              const dateKey = getDateKey(day);
              const dayData = getDayData(day);
              const isSelected = selectedDate === dateKey;
              const today = isToday(day);

              return (
                <TouchableOpacity
                  key={day}
                  className={`flex-1 items-center py-1.5 rounded-lg mx-0.5 ${
                    isSelected ? 'bg-primary' : today ? 'bg-primary/10' : ''
                  }`}
                  onPress={() => setSelectedDate(dateKey)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : today ? 'text-primary' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </Text>
                  {dayData && (
                    <View className="flex-row gap-0.5 mt-0.5">
                      {dayData.totalExpense > 0 && (
                        <View className="w-1 h-1 rounded-full bg-red-400" />
                      )}
                      {dayData.totalIncome > 0 && (
                        <View className="w-1 h-1 rounded-full bg-green-400" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected day detail */}
      {selectedDate && (
        <View className="flex-1">
          <View className="px-4 py-2 bg-gray-100">
            <Text className="text-sm font-medium text-gray-600">
              {selectedDate} ({dayTransactions.length} 笔)
            </Text>
          </View>

          <FlatList
            data={dayTransactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => {
              const cat = categoryMap[item.categoryId];
              return (
                <TouchableOpacity
                  className="bg-white rounded-xl p-3 shadow-sm flex-row items-center justify-between"
                  onPress={() => router.push(`/transaction/${item.id}` as any)}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xl">{cat?.icon ?? '📦'}</Text>
                    <View>
                      <Text className="font-medium text-gray-900">{cat?.name ?? '未知'}</Text>
                      {item.note ? (
                        <Text className="text-xs text-gray-400">{item.note}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Text
                    className={`font-bold ${
                      item.type === 'expense' ? 'text-expense' : 'text-income'
                    }`}
                  >
                    {item.type === 'expense' ? '-' : '+'}¥{item.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-gray-400">当天无记录</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}
