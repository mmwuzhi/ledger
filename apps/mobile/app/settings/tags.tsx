import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import {
  SqliteTagRepository,
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  Tag,
  CreateTagInput,
} from '@moneybook/core';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#b5693a',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

export default function TagsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const tagRepo = new SqliteTagRepository(db);

  const { data: tags = [] } = useTags(tagRepo);
  const createTag = useCreateTag(tagRepo);
  const updateTag = useUpdateTag(tagRepo);
  const deleteTag = useDeleteTag(tagRepo);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const openAddModal = () => {
    setEditing(null);
    setName('');
    setColor(PRESET_COLORS[0]);
    setModalVisible(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditing(tag);
    setName(tag.name);
    setColor(tag.color);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }
    const input: CreateTagInput = { name: name.trim(), color };
    if (editing) {
      updateTag.mutate(
        { id: editing.id, input: { name: name.trim(), color } },
        { onSuccess: () => setModalVisible(false) }
      );
    } else {
      createTag.mutate(input, { onSuccess: () => setModalVisible(false) });
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('删除标签', `确定要删除「${tag.name}」吗？已标记的交易不受影响。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteTag.mutate(tag.id) },
    ]);
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">标签管理</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Text className="text-primary text-base">添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl p-3 shadow-sm flex-row items-center gap-2"
            onPress={() => openEditModal(item)}
            onLongPress={() => handleDelete(item)}
          >
            <View className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
            <Text className="font-medium text-gray-900 flex-1" numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">🏷️</Text>
            <Text className="text-gray-500 mb-1">暂无标签</Text>
            <Text className="text-gray-400 text-sm">点击右上角「添加」创建标签</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editing ? '编辑标签' : '添加标签'}
            </Text>

            <Text className="text-sm text-gray-500 mb-1">名称</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
              value={name}
              onChangeText={setName}
              placeholder="输入标签名称"
            />

            <Text className="text-sm text-gray-500 mb-2">颜色</Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  className={`w-9 h-9 rounded-full items-center justify-center ${
                    color === c ? 'border-2 border-gray-900' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Text className="text-white text-xs">✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-700 font-medium">取消</Text>
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
