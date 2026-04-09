import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import {
  SqliteCategoryRepository,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  Category,
  CreateCategoryInput,
} from '@moneybook/core';

type CategoryType = 'income' | 'expense' | 'both';

export default function CategoriesScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const categoryRepo = new SqliteCategoryRepository(db);
  const { data: categories = [], isLoading } = useCategories(categoryRepo);
  const createCategory = useCreateCategory(categoryRepo);
  const updateCategory = useUpdateCategory(categoryRepo);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<CategoryType>('expense');

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('📦');
    setType('expense');
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setType(category.type);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }
    const input: CreateCategoryInput = { name: name.trim(), icon, type };
    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, input: { name: name.trim(), icon, type } },
        { onSuccess: () => setModalVisible(false) },
      );
    } else {
      createCategory.mutate(input, { onSuccess: () => setModalVisible(false) });
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert('删除分类', `确定要删除「${category.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          categoryRepo.softDelete(category.id);
          // Refresh via invalidation handled by the hook pattern
          // Force a manual refetch since softDelete isn't wrapped in a mutation
          setTimeout(() => {
            createCategory.reset();
          }, 100);
        },
      },
    ]);
  };

  const typeOptions: { value: CategoryType; label: string }[] = [
    { value: 'expense', label: '支出' },
    { value: 'income', label: '收入' },
    { value: 'both', label: '通用' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-indigo-500 text-base">← 返回</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">分类管理</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Text className="text-indigo-500 text-base">添加</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
              onPress={() => openEditModal(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{item.icon || '📦'}</Text>
                <View>
                  <Text className="font-medium text-gray-900">{item.name}</Text>
                  <Text className="text-xs text-gray-400">
                    {item.type === 'income' ? '收入' : item.type === 'expense' ? '支出' : '通用'}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500">暂无分类</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingCategory ? '编辑分类' : '添加分类'}
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
              className="bg-gray-100 rounded-lg px-4 py-3 mb-3 text-base"
              value={name}
              onChangeText={setName}
              placeholder="输入分类名称"
            />

            <Text className="text-sm text-gray-500 mb-2">类型</Text>
            <View className="flex-row gap-2 mb-6">
              {typeOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    type === opt.value ? 'bg-indigo-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setType(opt.value)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      type === opt.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
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
                className="flex-1 py-3 rounded-lg bg-indigo-500 items-center"
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
