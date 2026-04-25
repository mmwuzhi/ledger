import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import {
  SqliteBudgetRepository,
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  useBudgets,
  useBudgetProgress,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useCategories,
  Budget,
  BudgetProgress,
} from '@moneybook/core';

export default function BudgetScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const budgetRepo = new SqliteBudgetRepository(db);
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: budgets = [] } = useBudgets(budgetRepo, year, month);
  const { data: progress = [] } = useBudgetProgress(
    budgetRepo,
    transactionRepo,
    categoryRepo,
    year,
    month
  );
  const { data: categories = [] } = useCategories(categoryRepo);
  const createBudget = useCreateBudget(budgetRepo, year, month);
  const updateBudget = useUpdateBudget(budgetRepo, year, month);
  const deleteBudget = useDeleteBudget(budgetRepo, year, month);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const existingCategoryIds = new Set(budgets.map((b) => b.categoryId));

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
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setSelectedCategoryId(null);
    setAmount('');
    setModalVisible(true);
  };

  const openEditModal = (p: BudgetProgress) => {
    const budget = budgets.find((b) => b.id === p.budgetId);
    if (!budget) return;
    setEditingBudget(budget);
    setSelectedCategoryId(budget.categoryId);
    setAmount(budget.amount.toString());
    setModalVisible(true);
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('提示', '请输入有效的预算金额');
      return;
    }
    if (editingBudget) {
      updateBudget.mutate(
        { id: editingBudget.id, input: { amount: parsedAmount } },
        { onSuccess: () => setModalVisible(false) }
      );
    } else {
      createBudget.mutate(
        { categoryId: selectedCategoryId, amount: parsedAmount, year, month },
        { onSuccess: () => setModalVisible(false) }
      );
    }
  };

  const handleDelete = (p: BudgetProgress) => {
    Alert.alert('删除预算', `确定要删除「${p.categoryName}」的预算吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteBudget.mutate(p.budgetId),
      },
    ]);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">预算管理</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Text className="text-primary text-base">添加</Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-center gap-6 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Text className="text-primary text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">
          {year}年{month}月
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Text className="text-primary text-lg">›</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={progress}
        keyExtractor={(item) => item.budgetId}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm"
            onPress={() => openEditModal(item)}
            onLongPress={() => handleDelete(item)}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{item.categoryIcon}</Text>
                <Text className="font-medium text-gray-900">{item.categoryName}</Text>
              </View>
              <Text className={`font-bold ${getProgressTextColor(item.percentage)}`}>
                {item.percentage}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
              <View
                className={`h-full rounded-full ${getProgressColor(item.percentage)}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">已花 ¥{item.spentAmount.toFixed(2)}</Text>
              <Text className="text-sm text-gray-500">预算 ¥{item.budgetAmount.toFixed(2)}</Text>
            </View>

            {item.isOverBudget && (
              <Text className="text-xs text-red-500 mt-1">
                超支 ¥{(item.spentAmount - item.budgetAmount).toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">💰</Text>
            <Text className="text-gray-500 mb-1">暂无预算</Text>
            <Text className="text-gray-400 text-sm">点击右上角「添加」设置预算</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingBudget ? '编辑预算' : '添加预算'}
            </Text>

            {!editingBudget && (
              <>
                <Text className="text-sm text-gray-500 mb-2">分类</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  <TouchableOpacity
                    className={`px-3 py-2 rounded-lg ${
                      selectedCategoryId === null ? 'bg-primary' : 'bg-gray-100'
                    }`}
                    onPress={() => setSelectedCategoryId(null)}
                    disabled={existingCategoryIds.has(null)}
                  >
                    <Text
                      className={`text-sm ${
                        selectedCategoryId === null
                          ? 'text-white'
                          : existingCategoryIds.has(null)
                            ? 'text-gray-300'
                            : 'text-gray-700'
                      }`}
                    >
                      💰 总预算
                    </Text>
                  </TouchableOpacity>
                  {expenseCategories.map((cat) => {
                    const alreadySet = existingCategoryIds.has(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        className={`px-3 py-2 rounded-lg ${
                          selectedCategoryId === cat.id
                            ? 'bg-primary'
                            : alreadySet
                              ? 'bg-canvas'
                              : 'bg-gray-100'
                        }`}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        disabled={alreadySet}
                      >
                        <Text
                          className={`text-sm ${
                            selectedCategoryId === cat.id
                              ? 'text-white'
                              : alreadySet
                                ? 'text-gray-300'
                                : 'text-gray-700'
                          }`}
                        >
                          {cat.icon} {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text className="text-sm text-gray-500 mb-1">预算金额</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-6 text-base"
              value={amount}
              onChangeText={setAmount}
              placeholder="输入预算金额"
              keyboardType="decimal-pad"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-700 font-medium">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-primary items-center"
                onPress={handleSave}
              >
                <Text className="text-white font-medium">保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
