import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { useDb } from '../../lib/db';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { SqliteSettingsRepository, useSettings, useUpdateSettings } from '@moneybook/core';

const PIN_KEY = 'moneybook_pin';

export default function AppLockScreen() {
  const router = useRouter();
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    checkBiometric();
    checkPin();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('指纹');
    }
  };

  const checkPin = async () => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    setHasPin(!!stored);
  };

  const handleToggleLock = async (enabled: boolean) => {
    if (enabled) {
      // Turning on: verify biometric or set up PIN
      if (biometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: '验证身份以启用应用锁',
          cancelLabel: '取消',
        });
        if (!result.success) return;
        updateSettings.mutate({ appLockEnabled: true, appLockMethod: 'biometric' });
      } else {
        // No biometric, must use PIN
        setShowPinSetup(true);
      }
    } else {
      // Turning off: verify first
      const verified = await verifyIdentity();
      if (verified) {
        updateSettings.mutate({ appLockEnabled: false });
      }
    }
  };

  const verifyIdentity = async (): Promise<boolean> => {
    const method = settings?.appLockMethod ?? 'biometric';
    if (method === 'biometric' || method === 'both') {
      if (biometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: '验证身份',
          cancelLabel: '取消',
        });
        return result.success;
      }
    }
    // Fallback: PIN verification would be handled via UI
    return true;
  };

  const handleSetPin = async () => {
    if (pin.length < 4) {
      Alert.alert('提示', 'PIN 码至少需要 4 位');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('提示', '两次输入不一致');
      return;
    }
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setHasPin(true);
    setShowPinSetup(false);
    setPin('');
    setConfirmPin('');

    const method = biometricAvailable ? 'both' : 'pin';
    updateSettings.mutate({ appLockEnabled: true, appLockMethod: method });
    Alert.alert('完成', 'PIN 码已设置');
  };

  const handleRemovePin = async () => {
    const verified = await verifyIdentity();
    if (!verified) return;
    await SecureStore.deleteItemAsync(PIN_KEY);
    setHasPin(false);
    if (settings?.appLockEnabled && settings.appLockMethod === 'pin') {
      updateSettings.mutate({ appLockEnabled: false });
    } else if (settings?.appLockEnabled && settings.appLockMethod === 'both') {
      updateSettings.mutate({ appLockMethod: 'biometric' });
    }
    Alert.alert('完成', 'PIN 码已移除');
  };

  const handleMethodChange = (method: 'biometric' | 'pin' | 'both') => {
    updateSettings.mutate({ appLockMethod: method });
  };

  const isEnabled = settings?.appLockEnabled ?? false;
  const currentMethod = settings?.appLockMethod ?? 'biometric';

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">应用锁</Text>
        <View className="w-12" />
      </View>

      <View className="p-4 gap-4">
        {/* Toggle */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-medium text-gray-900">启用应用锁</Text>
            <Text className="text-sm text-gray-500 mt-0.5">打开应用时需要验证身份</Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleLock}
            trackColor={{ true: '#b5693a' }}
          />
        </View>

        {/* Method selection */}
        {isEnabled && (
          <View className="bg-white rounded-xl p-4 gap-3">
            <Text className="text-sm text-gray-500">解锁方式</Text>

            {biometricAvailable && (
              <TouchableOpacity
                className="flex-row items-center justify-between py-2"
                onPress={() => handleMethodChange('biometric')}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-xl">🔐</Text>
                  <Text className="text-base text-gray-900">{biometricType || '生物识别'}</Text>
                </View>
                {(currentMethod === 'biometric' || currentMethod === 'both') && (
                  <Text className="text-primary">✓</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center justify-between py-2"
              onPress={() => {
                if (!hasPin) {
                  setShowPinSetup(true);
                } else {
                  handleMethodChange(
                    biometricAvailable && currentMethod !== 'pin' ? 'both' : 'pin'
                  );
                }
              }}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">🔢</Text>
                <Text className="text-base text-gray-900">PIN 码</Text>
              </View>
              {(currentMethod === 'pin' || currentMethod === 'both') && (
                <Text className="text-primary">✓</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* PIN management */}
        {isEnabled && (
          <View className="bg-white rounded-xl overflow-hidden">
            {hasPin ? (
              <>
                <TouchableOpacity
                  className="px-4 py-3.5 flex-row items-center justify-between border-b border-gray-100"
                  onPress={() => setShowPinSetup(true)}
                >
                  <Text className="text-base text-gray-900">修改 PIN 码</Text>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-3.5 flex-row items-center justify-between"
                  onPress={handleRemovePin}
                >
                  <Text className="text-base text-red-500">移除 PIN 码</Text>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                className="px-4 py-3.5 flex-row items-center justify-between"
                onPress={() => setShowPinSetup(true)}
              >
                <Text className="text-base text-gray-900">设置 PIN 码</Text>
                <Text className="text-gray-400">›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PIN Setup */}
        {showPinSetup && (
          <View className="bg-white rounded-xl p-4 gap-3">
            <Text className="text-base font-medium text-gray-900">设置 PIN 码</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-base text-center tracking-widest"
              value={pin}
              onChangeText={setPin}
              placeholder="输入 PIN 码（至少4位）"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-base text-center tracking-widest"
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="再次输入 PIN 码"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
                onPress={() => {
                  setShowPinSetup(false);
                  setPin('');
                  setConfirmPin('');
                }}
              >
                <Text className="text-gray-700 font-medium">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-primary items-center"
                onPress={handleSetPin}
              >
                <Text className="text-white font-medium">确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info */}
        <View className="px-2">
          <Text className="text-xs text-gray-400 leading-5">
            启用应用锁后，每次打开应用需验证身份。
            {biometricAvailable
              ? `支持${biometricType}和 PIN 码两种方式。`
              : '当前设备不支持生物识别，请使用 PIN 码。'}
          </Text>
        </View>
      </View>
    </View>
  );
}
