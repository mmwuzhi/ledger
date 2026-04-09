import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  SqliteTransactionRepository, SqliteCategoryRepository, SqliteReceiptRepository,
  useCreateTransaction, useCreateReceipt, useUpdateReceiptOcr, useCategories,
  OcrService, CreateTransactionInput,
} from '@moneybook/core';

const ocrService = new OcrService({
  recognize: async (imageUri: string) => {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
  },
});

export default function AddScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const transactionRepo = new SqliteTransactionRepository(db);
  const categoryRepo = new SqliteCategoryRepository(db);
  const receiptRepo = new SqliteReceiptRepository(db);

  const { data: categories = [] } = useCategories(categoryRepo);
  const createTransaction = useCreateTransaction(transactionRepo);
  const createReceipt = useCreateReceipt(receiptRepo);
  const updateReceiptOcr = useUpdateReceiptOcr(receiptRepo);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');

  const handlePickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setReceiptUri(uri);
    setIsProcessing(true);

    try {
      const receipt = await createReceipt.mutateAsync({ imageUri: uri });
      const ocrResult = await ocrService.processReceipt(uri);
      await updateReceiptOcr.mutateAsync({ id: receipt.id, ocrResult });
      setReceiptId(receipt.id);
      if (ocrResult.amount) setAmount(ocrResult.amount.toString());
      if (ocrResult.date) setDate(ocrResult.date);
      if (ocrResult.note) setNote(ocrResult.note);
    } catch (e) {
      Alert.alert('OCR 失败', '无法识别小票内容，请手动填写');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('错误', '请输入有效金额');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('错误', '请选择分类');
      return;
    }
    const input: CreateTransactionInput = {
      type,
      amount: parseFloat(amount),
      categoryId: selectedCategoryId,
      note,
      date: new Date(date).toISOString(),
      receiptId,
    };
    await createTransaction.mutateAsync(input);
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">记账</Text>
      </View>

      <View className="p-4 gap-4">
        {/* Type toggle */}
        <View className="bg-white rounded-xl p-1 flex-row">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${type === 'expense' ? 'bg-expense' : ''}`}
            onPress={() => setType('expense')}
          >
            <Text className={`font-medium ${type === 'expense' ? 'text-white' : 'text-gray-600'}`}>支出</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${type === 'income' ? 'bg-income' : ''}`}
            onPress={() => setType('income')}
          >
            <Text className={`font-medium ${type === 'income' ? 'text-white' : 'text-gray-600'}`}>收入</Text>
          </TouchableOpacity>
        </View>

        {/* Receipt capture */}
        <View className="bg-white rounded-xl p-4 gap-3">
          <Text className="font-medium text-gray-700">小票</Text>
          {receiptUri ? (
            <Image source={{ uri: receiptUri }} className="w-full h-40 rounded-lg" resizeMode="cover" />
          ) : null}
          {isProcessing ? (
            <Text className="text-center text-gray-500 py-2">识别中...</Text>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                onPress={() => handlePickImage(true)}
              >
                <Text>📷 拍照</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                onPress={() => handlePickImage(false)}
              >
                <Text>🖼️ 相册</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
            {filteredCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                className={`px-3 py-2 rounded-lg flex-row items-center gap-1 ${selectedCategoryId === cat.id ? 'bg-primary' : 'bg-gray-100'}`}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text>{cat.icon}</Text>
                <Text className={selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'}>{cat.name}</Text>
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
          disabled={createTransaction.isPending}
        >
          <Text className="text-white font-bold text-lg">
            {createTransaction.isPending ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
