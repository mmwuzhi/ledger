import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useRouter } from 'expo-router';
import { OcrService } from '@moneybook/core';

const ocrService = new OcrService({
  recognize: async (imageUri: string) => {
    const result = await TextRecognition.recognize(imageUri);
    return result.text;
  },
});

export default function CaptureScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setIsProcessing(true);
    try {
      const ocrResult = await ocrService.processReceipt(uri);
      setRawText(ocrResult.rawText);
    } catch {
      Alert.alert('识别失败', '请手动填写');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row items-center gap-3 pt-14 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold">扫描小票</Text>
      </View>

      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-full h-64 rounded-xl" resizeMode="contain" />
      ) : (
        <View className="w-full h-64 bg-white rounded-xl items-center justify-center">
          <Text className="text-5xl">🧾</Text>
          <Text className="text-gray-400 mt-2">尚未选择图片</Text>
        </View>
      )}

      {isProcessing && <Text className="text-center text-gray-500 mt-4">识别中...</Text>}
      {rawText && !isProcessing && (
        <View className="bg-white rounded-xl p-4 mt-4">
          <Text className="font-medium text-gray-700 mb-2">识别内容</Text>
          <Text className="text-gray-600 text-sm">{rawText}</Text>
        </View>
      )}

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity className="flex-1 bg-white rounded-xl py-4 items-center" onPress={() => handleCapture(true)}>
          <Text>📷 拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-white rounded-xl py-4 items-center" onPress={() => handleCapture(false)}>
          <Text>🖼️ 相册</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
