import { View, Text, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { SqliteSettingsRepository, useSettings, useUpdateSettings } from '@moneybook/core';

const CURRENCY_OPTIONS = [
  { symbol: '¥', label: '人民币 (¥)' },
  { symbol: '$', label: '美元 ($)' },
  { symbol: '€', label: '欧元 (€)' },
  { symbol: '£', label: '英镑 (£)' },
  { symbol: '₩', label: '韩元 (₩)' },
];

export default function CurrencyScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);

  const currentCurrency = settings?.currency ?? '¥';

  const handleSelect = (symbol: string) => {
    updateSettings.mutate({ currency: symbol });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-indigo-500 text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">货币符号</Text>
      </View>

      <View className="p-4">
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          {CURRENCY_OPTIONS.map((opt, index) => (
            <TouchableOpacity
              key={opt.symbol}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                index < CURRENCY_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => handleSelect(opt.symbol)}
            >
              <Text className="text-base text-gray-900">{opt.label}</Text>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  currentCurrency === opt.symbol ? 'border-indigo-500' : 'border-gray-300'
                }`}
              >
                {currentCurrency === opt.symbol && (
                  <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
