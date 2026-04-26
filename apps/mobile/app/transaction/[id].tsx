import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useDb } from '../../lib/db';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  SqliteReceiptRepository,
  useTransaction,
  useUpdateTransaction,
  useCategories,
  useReceipt,
  UpdateTransactionInput,
} from '@moneybook/core';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDb();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const receiptRepo = new SqliteReceiptRepository(db);

  const { data: transaction } = useTransaction(id, transactionRepo);
  const { data: categories = [] } = useCategories(categoryRepo);
  const { data: receipt } = useReceipt(transaction?.receiptId ?? '', receiptRepo);
  const updateTransaction = useUpdateTransaction(transactionRepo);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setSelectedCategoryId(transaction.categoryId);
      setNote(transaction.note);
      setDate(transaction.date.slice(0, 10));
    }
  }, [transaction]);

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('错误', '请输入有效金额');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('错误', '请选择分类');
      return;
    }
    const input: UpdateTransactionInput = {
      type,
      amount: parseFloat(amount),
      categoryId: selectedCategoryId,
      note,
      date: new Date(date).toISOString(),
    };
    await updateTransaction.mutateAsync({ id, input });
    router.back();
  };

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">编辑记录</Text>
      </View>

      <View className="p-4 gap-4">
        {/* Type toggle */}
        <View className="bg-white rounded-xl p-1 flex-row">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${type === 'expense' ? 'bg-expense' : ''}`}
            onPress={() => setType('expense')}
          >
            <Text className={`font-medium ${type === 'expense' ? 'text-white' : 'text-gray-600'}`}>
              支出
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${type === 'income' ? 'bg-income' : ''}`}
            onPress={() => setType('income')}
          >
            <Text className={`font-medium ${type === 'income' ? 'text-white' : 'text-gray-600'}`}>
              收入
            </Text>
          </TouchableOpacity>
        </View>

        {/* Receipt image if exists */}
        {receipt?.imageUri ? (
          <View className="bg-white rounded-xl p-4">
            <Text className="font-medium text-gray-700 mb-2">小票</Text>
            <Image
              source={{ uri: receipt.imageUri }}
              className="w-full h-48 rounded-lg"
              resizeMode="contain"
            />
            {receipt.ocrResult?.rawText ? (
              <Text className="text-xs text-gray-400 mt-2">
                识别文本: {receipt.ocrResult.rawText.slice(0, 100)}...
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Amount */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-medium text-gray-700 mb-2">金额</Text>
          <TextInput
            className="text-3xl font-bold text-gray-900"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Category */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-medium text-gray-700 mb-3">分类</Text>
          <View className="flex-row flex-wrap gap-2">
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                className={`px-3 py-2 rounded-lg flex-row items-center gap-1 ${selectedCategoryId === cat.id ? 'bg-primary' : 'bg-gray-100'}`}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text>{cat.icon}</Text>
                <Text className={selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-medium text-gray-700 mb-2">日期</Text>
          <TextInput
            className="text-gray-900"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Note */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-medium text-gray-700 mb-2">备注</Text>
          <TextInput
            className="text-gray-900"
            placeholder="添加备注..."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={handleSubmit}
          disabled={updateTransaction.isPending}
        >
          <Text className="text-white font-bold text-lg">
            {updateTransaction.isPending ? '保存中...' : '保存修改'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
