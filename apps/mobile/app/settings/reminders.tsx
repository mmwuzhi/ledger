import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Platform, TextInput } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SqliteSettingsRepository, useSettings, useUpdateSettings } from '@moneybook/core';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RemindersScreen() {
  const router = useRouter();
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);
  const [hasPermission, setHasPermission] = useState(false);

  const reminderEnabled = settings?.reminderEnabled ?? false;
  const reminderTime = settings?.reminderTime ?? '21:00';
  const budgetAlertEnabled = settings?.budgetAlertEnabled ?? true;
  const budgetAlertThreshold = settings?.budgetAlertThreshold ?? 80;

  const [editingTime, setEditingTime] = useState(reminderTime);

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    setEditingTime(reminderTime);
  }, [reminderTime]);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    if (!granted) {
      Alert.alert('权限不足', '请在系统设置中允许通知权限');
    }
    return granted;
  };

  const scheduleReminder = async (time: string) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hours, minutes] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '记账提醒 📝',
        body: '今天的账记了吗？打开 MoneyBook 记一笔吧！',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) return;
      await scheduleReminder(reminderTime);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    updateSettings.mutate({ reminderEnabled: enabled });
  };

  const handleTimeChange = async () => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(editingTime)) {
      Alert.alert('格式错误', '请输入有效时间格式（HH:MM）');
      return;
    }
    updateSettings.mutate({ reminderTime: editingTime });
    if (reminderEnabled) {
      await scheduleReminder(editingTime);
    }
    Alert.alert('已保存', `提醒时间已设为 ${editingTime}`);
  };

  const handleToggleBudgetAlert = (enabled: boolean) => {
    updateSettings.mutate({ budgetAlertEnabled: enabled });
  };

  const handleThresholdChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateSettings.mutate({ budgetAlertThreshold: num });
    }
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-gray-900">
      <View className="bg-white dark:bg-gray-800 px-4 pt-14 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-4">提醒设置</Text>
      </View>

      <View className="p-4 gap-4">
        {/* Daily reminder */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">
                每日记账提醒
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {hasPermission ? '通知权限已授权' : '需要通知权限'}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ true: '#b5693a' }}
            />
          </View>

          {reminderEnabled && (
            <View className="gap-3">
              <View>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">提醒时间</Text>
                <View className="flex-row items-center gap-3">
                  <TextInput
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 text-base text-center text-gray-900 dark:text-white"
                    value={editingTime}
                    onChangeText={setEditingTime}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    className="bg-primary rounded-lg px-4 py-3"
                    onPress={handleTimeChange}
                  >
                    <Text className="text-white font-medium">设置</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Budget alert */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">
                预算超支提醒
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                预算使用达到阈值时提醒
              </Text>
            </View>
            <Switch
              value={budgetAlertEnabled}
              onValueChange={handleToggleBudgetAlert}
              trackColor={{ true: '#b5693a' }}
            />
          </View>

          {budgetAlertEnabled && (
            <View>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                提醒阈值：{budgetAlertThreshold}%
              </Text>
              <View className="flex-row items-center gap-2">
                {[50, 70, 80, 90].map((val) => (
                  <TouchableOpacity
                    key={val}
                    className={`flex-1 py-2 rounded-lg items-center ${budgetAlertThreshold === val ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`}
                    onPress={() => handleThresholdChange(String(val))}
                  >
                    <Text
                      className={`text-sm ${budgetAlertThreshold === val ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {val}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className="px-2">
          <Text className="text-xs text-gray-400 dark:text-gray-500 leading-5">
            每日提醒会在设定时间推送通知。预算超支提醒会在记账后检测是否超过阈值。
          </Text>
        </View>
      </View>
    </View>
  );
}
