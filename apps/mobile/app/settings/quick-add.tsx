import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, FlatList } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import {
  SqliteQuickTemplateRepository,
  SqliteCategoryRepository,
  useQuickTemplates,
  useCreateQuickTemplate,
  useUpdateQuickTemplate,
  useDeleteQuickTemplate,
  useCategories,
  QuickTemplate,
  CreateQuickTemplateInput,
  CURRENCIES,
} from '@moneybook/core';

export default function QuickAddScreen() {
  const router = useRouter();
  const db = useDb();
  const templateRepo = new SqliteQuickTemplateRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);

  const { data: templates = [] } = useQuickTemplates(templateRepo);
  const { data: categories = [] } = useCategories(categoryRepo);
  const createTemplate = useCreateQuickTemplate(templateRepo);
  const updateTemplate = useUpdateQuickTemplate(templateRepo);
  const deleteTemplate = useDeleteQuickTemplate(templateRepo);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<QuickTemplate | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState('CNY');

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setAmount('');
    setCategoryId('');
    setNote('');
    setCurrency('CNY');
    setModalVisible(true);
  };

  const openEdit = (t: QuickTemplate) => {
    setEditing(t);
    setName(t.name);
    setType(t.type);
    setAmount(String(t.amount));
    setCategoryId(t.categoryId);
    setNote(t.note);
    setCurrency(t.currency);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入模板名称');
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!categoryId) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    const input: CreateQuickTemplateInput = {
      name: name.trim(),
      type,
      amount: parseFloat(amount),
      categoryId,
      note,
      currency,
    };

    if (editing) {
      updateTemplate.mutate({ id: editing.id, input }, { onSuccess: () => setModalVisible(false) });
    } else {
      createTemplate.mutate(input, { onSuccess: () => setModalVisible(false) });
    }
  };

  const handleDelete = (t: QuickTemplate) => {
    Alert.alert('删除模板', `确定要删除「${t.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteTemplate.mutate(t.id) },
    ]);
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">快捷记账</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text className="text-primary text-base">添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const cat = categoryMap[item.categoryId];
          const sym = CURRENCIES.find((c) => c.code === item.currency)?.symbol ?? '¥';
          return (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={() => openEdit(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{cat?.icon ?? '📦'}</Text>
                <View>
                  <Text className="font-medium text-gray-900 dark:text-white">{item.name}</Text>
                  <Text className="text-xs text-gray-400">
                    {cat?.name ?? '未知'} · {item.type === 'expense' ? '支出' : '收入'}
                  </Text>
                </View>
              </View>
              <Text
                className={`text-lg font-bold ${item.type === 'expense' ? 'text-expense' : 'text-income'}`}
              >
                {sym}
                {item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">⚡</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-lg">还没有快捷模板</Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              点击右上角「添加」创建常用记账模板
            </Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white dark:bg-gray-800 rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editing ? '编辑模板' : '添加模板'}
            </Text>

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">模板名称</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 mb-3 text-base text-gray-900 dark:text-white"
              value={name}
              onChangeText={setName}
              placeholder="如：早餐、地铁"
              placeholderTextColor="#9ca3af"
            />

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">类型</Text>
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${type === 'expense' ? 'bg-expense' : 'bg-gray-100 dark:bg-gray-700'}`}
                onPress={() => {
                  setType('expense');
                  setCategoryId('');
                }}
              >
                <Text
                  className={
                    type === 'expense'
                      ? 'text-white font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${type === 'income' ? 'bg-income' : 'bg-gray-100 dark:bg-gray-700'}`}
                onPress={() => {
                  setType('income');
                  setCategoryId('');
                }}
              >
                <Text
                  className={
                    type === 'income'
                      ? 'text-white font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  收入
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">金额</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 mb-3 text-base text-gray-900 dark:text-white"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">分类</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${categoryId === cat.id ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text className="text-sm">{cat.icon}</Text>
                  <Text
                    className={`text-sm ${categoryId === cat.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">备注（可选）</Text>
            <TextInput
              className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 mb-4 text-base text-gray-900 dark:text-white"
              value={note}
              onChangeText={setNote}
              placeholder="添加备注..."
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-gray-600 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-700 dark:text-gray-300 font-medium">取消</Text>
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
