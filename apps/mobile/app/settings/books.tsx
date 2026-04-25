import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import {
  SqliteBookRepository,
  SqliteSettingsRepository,
  useBooks,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  useSettings,
  useUpdateSettings,
  Book,
  CreateBookInput,
} from '@moneybook/core';

export default function BooksScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const bookRepo = new SqliteBookRepository(db);
  const settingsRepo = new SqliteSettingsRepository(db);

  const { data: books = [] } = useBooks(bookRepo);
  const { data: settings } = useSettings(settingsRepo);
  const createBook = useCreateBook(bookRepo);
  const updateBook = useUpdateBook(bookRepo);
  const deleteBook = useDeleteBook(bookRepo);
  const updateSettings = useUpdateSettings(settingsRepo);

  const currentBookId = settings?.currentBookId ?? 'default';

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📒');

  const openAddModal = () => {
    setEditing(null);
    setName('');
    setIcon('📒');
    setModalVisible(true);
  };

  const openEditModal = (book: Book) => {
    setEditing(book);
    setName(book.name);
    setIcon(book.icon);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入账本名称');
      return;
    }
    const input: CreateBookInput = { name: name.trim(), icon };
    if (editing) {
      updateBook.mutate(
        { id: editing.id, input: { name: name.trim(), icon } },
        { onSuccess: () => setModalVisible(false) }
      );
    } else {
      createBook.mutate(input, { onSuccess: () => setModalVisible(false) });
    }
  };

  const handleDelete = (book: Book) => {
    if (book.id === 'default') {
      Alert.alert('提示', '默认账本不能删除');
      return;
    }
    if (book.id === currentBookId) {
      Alert.alert('提示', '当前使用的账本不能删除，请先切换到其他账本');
      return;
    }
    Alert.alert('删除账本', `确定要删除「${book.name}」吗？其中的账单不会被删除。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteBook.mutate(book.id) },
    ]);
  };

  const handleSelectBook = (book: Book) => {
    updateSettings.mutate({ currentBookId: book.id });
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">账本管理</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Text className="text-primary text-base">添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const isActive = item.id === currentBookId;
          return (
            <TouchableOpacity
              className={`bg-white rounded-xl p-4 shadow-sm flex-row items-center justify-between ${
                isActive ? 'border-2 border-indigo-500' : ''
              }`}
              onPress={() => handleSelectBook(item)}
              onLongPress={() => openEditModal(item)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{item.icon}</Text>
                <View>
                  <Text className="font-medium text-gray-900">{item.name}</Text>
                  {isActive && <Text className="text-xs text-primary">当前使用</Text>}
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                {item.id !== 'default' && (
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Text className="text-red-400 text-sm">删除</Text>
                  </TouchableOpacity>
                )}
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-500">暂无账本</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editing ? '编辑账本' : '新建账本'}
            </Text>

            <Text className="text-sm text-gray-500 mb-1">图标</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
              value={icon}
              onChangeText={setIcon}
              placeholder="输入 emoji 图标"
            />

            <Text className="text-sm text-gray-500 mb-1">名称</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 mb-6 text-base"
              value={name}
              onChangeText={setName}
              placeholder="输入账本名称"
            />

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
