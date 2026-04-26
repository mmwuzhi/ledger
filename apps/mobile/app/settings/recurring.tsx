import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import {
  SqliteRecurringRepository,
  SqliteCategoryRepository,
  useRecurringTransactions,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useCategories,
  RecurringTransaction,
  RecurringFrequency,
  CreateRecurringInput,
} from '@moneybook/core';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
};

const DAY_OF_WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function RecurringScreen() {
  const router = useRouter();
  const db = useDb();
  const recurringRepo = new SqliteRecurringRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);

  const { data: recurring = [] } = useRecurringTransactions(recurringRepo);
  const { data: categories = [] } = useCategories(categoryRepo);
  const createRecurring = useCreateRecurring(recurringRepo);
  const updateRecurring = useUpdateRecurring(recurringRepo);
  const deleteRecurring = useDeleteRecurring(recurringRepo);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const openAddModal = () => {
    setEditing(null);
    setType('expense');
    setAmount('');
    setSelectedCategoryId(null);
    setNote('');
    setFrequency('monthly');
    setDayOfWeek(1);
    setDayOfMonth(1);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setModalVisible(true);
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditing(item);
    setType(item.type);
    setAmount(item.amount.toString());
    setSelectedCategoryId(item.categoryId);
    setNote(item.note);
    setFrequency(item.frequency);
    setDayOfWeek(item.dayOfWeek ?? 1);
    setDayOfMonth(item.dayOfMonth ?? 1);
    setStartDate(item.startDate);
    setEndDate(item.endDate ?? '');
    setModalVisible(true);
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    const input: CreateRecurringInput = {
      type,
      amount: parsedAmount,
      categoryId: selectedCategoryId,
      note,
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
      startDate,
      endDate: endDate || null,
    };

    if (editing) {
      updateRecurring.mutate(
        { id: editing.id, input },
        { onSuccess: () => setModalVisible(false) }
      );
    } else {
      createRecurring.mutate(input, { onSuccess: () => setModalVisible(false) });
    }
  };

  const handleDelete = (item: RecurringTransaction) => {
    const cat = categoryMap[item.categoryId];
    Alert.alert('删除定期记账', `确定要删除「${cat?.name ?? ''} ¥${item.amount}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteRecurring.mutate(item.id) },
    ]);
  };

  const handleToggleEnabled = (item: RecurringTransaction) => {
    updateRecurring.mutate({
      id: item.id,
      input: { enabled: !item.enabled },
    });
  };

  const getFrequencyLabel = (item: RecurringTransaction) => {
    switch (item.frequency) {
      case 'daily':
        return '每日';
      case 'weekly':
        return `每${DAY_OF_WEEK_LABELS[item.dayOfWeek ?? 0]}`;
      case 'monthly':
        return `每月${item.dayOfMonth ?? 1}日`;
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">定期记账</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Text className="text-primary text-base">添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const cat = categoryMap[item.categoryId];
          return (
            <TouchableOpacity
              className={`bg-white rounded-xl p-4 shadow-sm ${!item.enabled ? 'opacity-50' : ''}`}
              onPress={() => openEditModal(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{cat?.icon ?? '📦'}</Text>
                  <View>
                    <Text className="font-medium text-gray-900">{cat?.name ?? '未知'}</Text>
                    {item.note ? <Text className="text-xs text-gray-400">{item.note}</Text> : null}
                  </View>
                </View>
                <Text
                  className={`text-lg font-bold ${item.type === 'expense' ? 'text-expense' : 'text-income'}`}
                >
                  {item.type === 'expense' ? '-' : '+'}¥{item.amount.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-gray-400">🔄 {getFrequencyLabel(item)}</Text>
                  {item.endDate && (
                    <Text className="text-xs text-gray-400">截止 {item.endDate}</Text>
                  )}
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleEnabled(item)}
                  trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                  thumbColor="#fff"
                />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">🔄</Text>
            <Text className="text-gray-500 mb-1">暂无定期记账</Text>
            <Text className="text-gray-400 text-sm">点击右上角「添加」创建定期记账</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-6 max-h-[85%]">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editing ? '编辑定期记账' : '添加定期记账'}
            </Text>

            {/* Type toggle */}
            <View className="bg-gray-100 rounded-xl p-1 flex-row mb-4">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${type === 'expense' ? 'bg-expense' : ''}`}
                onPress={() => {
                  setType('expense');
                  setSelectedCategoryId(null);
                }}
              >
                <Text
                  className={`font-medium ${type === 'expense' ? 'text-white' : 'text-gray-600'}`}
                >
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${type === 'income' ? 'bg-income' : ''}`}
                onPress={() => {
                  setType('income');
                  setSelectedCategoryId(null);
                }}
              >
                <Text
                  className={`font-medium ${type === 'income' ? 'text-white' : 'text-gray-600'}`}
                >
                  收入
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text className="text-sm text-gray-500 mb-1">金额</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
              value={amount}
              onChangeText={setAmount}
              placeholder="输入金额"
              keyboardType="decimal-pad"
            />

            {/* Category */}
            <Text className="text-sm text-gray-500 mb-2">分类</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`px-3 py-2 rounded-lg ${
                    selectedCategoryId === cat.id ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text
                    className={`text-sm ${
                      selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note */}
            <Text className="text-sm text-gray-500 mb-1">备注</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
              value={note}
              onChangeText={setNote}
              placeholder="添加备注（可选）"
            />

            {/* Frequency */}
            <Text className="text-sm text-gray-500 mb-2">频率</Text>
            <View className="flex-row gap-2 mb-3">
              {(['daily', 'weekly', 'monthly'] as RecurringFrequency[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    frequency === f ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  onPress={() => setFrequency(f)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      frequency === f ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {FREQUENCY_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day of Week (for weekly) */}
            {frequency === 'weekly' && (
              <>
                <Text className="text-sm text-gray-500 mb-2">星期几</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {DAY_OF_WEEK_LABELS.map((label, i) => (
                    <TouchableOpacity
                      key={i}
                      className={`px-3 py-2 rounded-lg ${
                        dayOfWeek === i ? 'bg-primary' : 'bg-gray-100'
                      }`}
                      onPress={() => setDayOfWeek(i)}
                    >
                      <Text
                        className={`text-sm ${dayOfWeek === i ? 'text-white' : 'text-gray-700'}`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Day of Month (for monthly) */}
            {frequency === 'monthly' && (
              <>
                <Text className="text-sm text-gray-500 mb-1">每月几号</Text>
                <TextInput
                  className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
                  value={dayOfMonth.toString()}
                  onChangeText={(v) => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n >= 1 && n <= 31) setDayOfMonth(n);
                  }}
                  keyboardType="number-pad"
                  placeholder="1-31"
                />
              </>
            )}

            {/* Start Date */}
            <Text className="text-sm text-gray-500 mb-1">开始日期</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />

            {/* End Date */}
            <Text className="text-sm text-gray-500 mb-1">结束日期（可选）</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD（留空为永不结束）"
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
