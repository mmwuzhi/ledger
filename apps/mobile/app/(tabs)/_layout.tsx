import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#b5693a' }}>
      <Tabs.Screen
        name="index"
        options={{ title: '账单', tabBarIcon: ({ color }) => <Text style={{ color }}>📋</Text> }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: '记账', tabBarIcon: ({ color }) => <Text style={{ color }}>➕</Text> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: '日历', tabBarIcon: ({ color }) => <Text style={{ color }}>📅</Text> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: '统计', tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '我的', tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
      />
    </Tabs>
  );
}
