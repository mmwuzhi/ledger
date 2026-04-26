import { View, Text, TouchableOpacity } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import { SqliteSettingsRepository, useSettings, useUpdateSettings } from '@moneybook/core';

const THEME_OPTIONS = [
  { value: 'system' as const, label: '跟随系统', icon: '📱' },
  { value: 'light' as const, label: '浅色模式', icon: '☀️' },
  { value: 'dark' as const, label: '深色模式', icon: '🌙' },
];

export default function ThemeScreen() {
  const router = useRouter();
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);

  const currentTheme = settings?.theme ?? 'system';

  const handleSelect = (value: 'light' | 'dark' | 'system') => {
    updateSettings.mutate({ theme: value });
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-4">主题</Text>
      </View>

      <View className="p-4">
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {THEME_OPTIONS.map((opt, index) => (
            <TouchableOpacity
              key={opt.value}
              className={`flex-row items-center justify-between px-4 py-4 ${
                index < THEME_OPTIONS.length - 1
                  ? 'border-b border-gray-100 dark:border-gray-700'
                  : ''
              }`}
              onPress={() => handleSelect(opt.value)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{opt.icon}</Text>
                <Text className="text-base text-gray-900 dark:text-white">{opt.label}</Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  currentTheme === opt.value ? 'border-indigo-500' : 'border-gray-300'
                }`}
              >
                {currentTheme === opt.value && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-2 mt-4">
          <Text className="text-xs text-gray-400 dark:text-gray-500 leading-5">
            选择「跟随系统」将根据设备当前的深色/浅色模式自动切换主题。
          </Text>
        </View>
      </View>
    </View>
  );
}
