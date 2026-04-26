import { View, Text, TouchableOpacity } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import { SqliteSettingsRepository, useSettings, useUpdateSettings } from '@moneybook/core';

const TYPE_OPTIONS: { value: 'expense' | 'income'; label: string; icon: string }[] = [
  { value: 'expense', label: '支出', icon: '💸' },
  { value: 'income', label: '收入', icon: '💰' },
];

export default function DefaultTypeScreen() {
  const router = useRouter();
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);

  const currentType = settings?.defaultTransactionType ?? 'expense';

  const handleSelect = (value: 'expense' | 'income') => {
    updateSettings.mutate({ defaultTransactionType: value });
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4">默认记账类型</Text>
      </View>

      <View className="p-4">
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          {TYPE_OPTIONS.map((opt, index) => (
            <TouchableOpacity
              key={opt.value}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                index < TYPE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => handleSelect(opt.value)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{opt.icon}</Text>
                <Text className="text-base text-gray-900">{opt.label}</Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  currentType === opt.value ? 'border-indigo-500' : 'border-gray-300'
                }`}
              >
                {currentType === opt.value && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm text-gray-400 mt-3 px-2">设置后，新建记账时将默认选择此类型</Text>
      </View>
    </View>
  );
}
