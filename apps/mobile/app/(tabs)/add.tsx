import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  SqliteTransactionRepository,
  SqliteCategoryRepository,
  SqliteReceiptRepository,
  SqliteTagRepository,
  SqliteSettingsRepository,
  SqliteQuickTemplateRepository,
  useCreateTransaction,
  useCreateReceipt,
  useUpdateReceiptOcr,
  useCategories,
  useTags,
  useSetTransactionTags,
  useSettings,
  useQuickTemplates,
  OcrService,
  CreateTransactionInput,
  CURRENCIES,
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
  const tagRepo = new SqliteTagRepository(db);
  const settingsRepo = new SqliteSettingsRepository(db);
  const templateRepo = new SqliteQuickTemplateRepository(db);

  const { data: categories = [] } = useCategories(categoryRepo);
  const { data: settings } = useSettings(settingsRepo);
  const { data: quickTemplates = [] } = useQuickTemplates(templateRepo);
  const { data: allTags = [] } = useTags(tagRepo);
  const createTransaction = useCreateTransaction(transactionRepo);
  const createReceipt = useCreateReceipt(receiptRepo);
  const updateReceiptOcr = useUpdateReceiptOcr(receiptRepo);
  const setTransactionTags = useSetTransactionTags(tagRepo);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState('');

  // Default currency from settings
  const defaultCurrency =
    settings?.currency === '¥'
      ? 'CNY'
      : settings?.currency === '$'
        ? 'USD'
        : settings?.currency === '€'
          ? 'EUR'
          : settings?.currency === '£'
            ? 'GBP'
            : settings?.currency === '₩'
              ? 'KRW'
              : 'CNY';
  const activeCurrency = currency || defaultCurrency;
  const currencySymbol = CURRENCIES.find((c) => c.code === activeCurrency)?.symbol ?? '¥';

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handlePickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

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
      currency: activeCurrency,
    };
    const txn = await createTransaction.mutateAsync(input);
    if (selectedTagIds.length > 0) {
      await setTransactionTags.mutateAsync({ transactionId: txn.id, tagIds: selectedTagIds });
    }
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">记账</Text>
      </View>

      <View className="p-4 gap-4">
        {/* Quick templates */}
        {quickTemplates.length > 0 && (
          <View>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">⚡ 快捷记账</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              <View className="flex-row gap-2">
                {quickTemplates.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const sym = CURRENCIES.find((c) => c.code === t.currency)?.symbol ?? '¥';
                  return (
                    <TouchableOpacity
                      key={t.id}
                      className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex-row items-center gap-2 shadow-sm"
                      onPress={() => {
                        setType(t.type);
                        setAmount(String(t.amount));
                        setSelectedCategoryId(t.categoryId);
                        setNote(t.note);
                        setCurrency(t.currency);
                      }}
                    >
                      <Text>{cat?.icon ?? '📦'}</Text>
                      <View>
                        <Text className="text-sm font-medium text-gray-900 dark:text-white">
                          {t.name}
                        </Text>
                        <Text
                          className={`text-xs ${t.type === 'expense' ? 'text-expense' : 'text-income'}`}
                        >
                          {sym}
                          {t.amount}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

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

        {/* Receipt capture */}
        <View className="bg-white rounded-xl p-4 gap-3">
          <Text className="font-medium text-gray-700">小票</Text>
          {receiptUri ? (
            <Image
              source={{ uri: receiptUri }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
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

        {/* Amount + Currency */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-medium text-gray-700 dark:text-gray-300">金额</Text>
            <View className="flex-row gap-1.5">
              {CURRENCIES.slice(0, 5).map((c) => (
                <TouchableOpacity
                  key={c.code}
                  className={`px-2.5 py-1 rounded-lg ${activeCurrency === c.code ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onPress={() => setCurrency(c.code)}
                >
                  <Text
                    className={`text-xs ${activeCurrency === c.code ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    {c.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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

        {/* Tags */}
        {allTags.length > 0 && (
          <View className="bg-white rounded-xl p-4">
            <Text className="font-medium text-gray-700 mb-3">标签</Text>
            <View className="flex-row flex-wrap gap-2">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                      isSelected ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: isSelected ? tag.color : '#e5e7eb' }}
                    onPress={() => {
                      setSelectedTagIds((prev) =>
                        isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                      );
                    }}
                  >
                    <Text className={`text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

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
