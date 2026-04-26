import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  SqliteReceiptRepository,
  SqliteTagRepository,
  useTransactions,
  useSearchTransactions,
  useDeleteTransaction,
  useCategories,
  useTags,
  useTransactionTags,
  TransactionSearchFilters,
  Transaction,
  CURRENCIES,
} from '@moneybook/core';

function useDependencies() {
  const db = useDb();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const receiptRepo = new SqliteReceiptRepository(db);
  const tagRepo = new SqliteTagRepository(db);
  return { transactionRepo, categoryRepo, receiptRepo, tagRepo };
}

export default function HomeScreen() {
  const router = useRouter();
  const { transactionRepo, categoryRepo, tagRepo } = useDependencies();
  const { data: allTransactions = [], isLoading } = useTransactions(transactionRepo);
  const { data: categories = [] } = useCategories(categoryRepo);
  const { data: allTags = [] } = useTags(tagRepo);
  const deleteTransaction = useDeleteTransaction(transactionRepo);

  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'income' | 'expense' | undefined>(undefined);
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(undefined);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  const filters: TransactionSearchFilters = useMemo(
    () => ({
      keyword: keyword || undefined,
      type: filterType,
      categoryId: filterCategoryId,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
      tagIds: filterTagIds.length > 0 ? filterTagIds : undefined,
    }),
    [keyword, filterType, filterCategoryId, amountMin, amountMax, dateFrom, dateTo, filterTagIds]
  );

  const hasFilters = Object.values(filters).some((v) => v !== undefined);
  const { data: searchResults = [] } = useSearchTransactions(filters, transactionRepo);

  const transactions: Transaction[] = hasFilters ? searchResults : allTransactions;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const filteredCategories = filterType
    ? categories.filter((c) => c.type === filterType || c.type === 'both')
    : categories;

  const clearFilters = () => {
    setKeyword('');
    setFilterType(undefined);
    setFilterCategoryId(undefined);
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
    setFilterTagIds([]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除确认', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteTransaction.mutate(id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-3 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">账单</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text className={`text-sm ${hasFilters ? 'text-primary font-bold' : 'text-gray-500'}`}>
              {showFilters ? '收起筛选' : '筛选'}
              {hasFilters ? ' ●' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-gray-900"
            placeholder="搜索备注..."
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Text className="text-gray-400">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View className="mt-3 gap-3">
            {/* Type filter */}
            <View>
              <Text className="text-xs text-gray-500 mb-1">类型</Text>
              <View className="flex-row gap-2">
                {([undefined, 'expense', 'income'] as const).map((t) => (
                  <TouchableOpacity
                    key={t ?? 'all'}
                    className={`px-3 py-1.5 rounded-lg ${filterType === t ? 'bg-primary' : 'bg-gray-100'}`}
                    onPress={() => {
                      setFilterType(t);
                      setFilterCategoryId(undefined);
                    }}
                  >
                    <Text
                      className={filterType === t ? 'text-white text-sm' : 'text-gray-700 text-sm'}
                    >
                      {t === undefined ? '全部' : t === 'expense' ? '支出' : '收入'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category filter */}
            <View>
              <Text className="text-xs text-gray-500 mb-1">分类</Text>
              <View className="flex-row flex-wrap gap-1.5">
                <TouchableOpacity
                  className={`px-2 py-1 rounded-lg ${!filterCategoryId ? 'bg-primary' : 'bg-gray-100'}`}
                  onPress={() => setFilterCategoryId(undefined)}
                >
                  <Text className={`text-xs ${!filterCategoryId ? 'text-white' : 'text-gray-700'}`}>
                    全部
                  </Text>
                </TouchableOpacity>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-2 py-1 rounded-lg flex-row items-center gap-0.5 ${filterCategoryId === cat.id ? 'bg-primary' : 'bg-gray-100'}`}
                    onPress={() => setFilterCategoryId(cat.id)}
                  >
                    <Text className="text-xs">{cat.icon}</Text>
                    <Text
                      className={`text-xs ${filterCategoryId === cat.id ? 'text-white' : 'text-gray-700'}`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount range */}
            <View>
              <Text className="text-xs text-gray-500 mb-1">金额范围</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                  placeholder="最小"
                  keyboardType="decimal-pad"
                  value={amountMin}
                  onChangeText={setAmountMin}
                />
                <Text className="text-gray-400">—</Text>
                <TextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                  placeholder="最大"
                  keyboardType="decimal-pad"
                  value={amountMax}
                  onChangeText={setAmountMax}
                />
              </View>
            </View>

            {/* Date range */}
            <View>
              <Text className="text-xs text-gray-500 mb-1">日期范围</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                  placeholder="开始 YYYY-MM-DD"
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <Text className="text-gray-400">—</Text>
                <TextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                  placeholder="结束 YYYY-MM-DD"
                  value={dateTo}
                  onChangeText={setDateTo}
                />
              </View>
            </View>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <View>
                <Text className="text-xs text-gray-500 mb-1">标签</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {allTags.map((tag) => {
                    const isSelected = filterTagIds.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        className="px-2 py-1 rounded-full flex-row items-center gap-1"
                        style={{ backgroundColor: isSelected ? tag.color : '#f3f4f6' }}
                        onPress={() => {
                          setFilterTagIds((prev) =>
                            isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          );
                        }}
                      >
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isSelected ? '#fff' : tag.color }}
                        />
                        <Text className={`text-xs ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Clear filters */}
            {hasFilters && (
              <TouchableOpacity onPress={clearFilters} className="items-center py-1">
                <Text className="text-sm text-expense">清除所有筛选</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Results count when filtering */}
      {hasFilters && (
        <View className="px-4 py-2">
          <Text className="text-xs text-gray-500">找到 {transactions.length} 条记录</Text>
        </View>
      )}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const category = categoryMap[item.categoryId];
          return (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={() => router.push(`/transaction/${item.id}`)}
              onLongPress={() => handleDelete(item.id)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{category?.icon ?? '📦'}</Text>
                <View>
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {category?.name ?? '未知'}
                  </Text>
                  {item.note ? <Text className="text-sm text-gray-500">{item.note}</Text> : null}
                  <Text className="text-xs text-gray-400">{item.date.slice(0, 10)}</Text>
                </View>
              </View>
              <Text
                className={`text-lg font-bold ${item.type === 'expense' ? 'text-expense' : 'text-income'}`}
              >
                {item.type === 'expense' ? '-' : '+'}
                {CURRENCIES.find((c) => c.code === (item.currency ?? 'CNY'))?.symbol ?? '¥'}
                {item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">{hasFilters ? '🔍' : '📒'}</Text>
            <Text className="text-gray-500 text-lg">
              {hasFilters ? '没有找到匹配的记录' : '还没有记录'}
            </Text>
            {!hasFilters && (
              <Text className="text-gray-400 text-sm mt-1">点击下方 ➕ 开始记账</Text>
            )}
          </View>
        }
      />
    </View>
  );
}
