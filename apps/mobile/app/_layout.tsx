import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import {
  runMigrations,
  RecurringService,
  SqliteRecurringRepository,
  SqliteTransactionRepository,
  SqliteSettingsRepository,
  useSettings,
  useUpdateSettings,
} from '@moneybook/core';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View, useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import LockScreen from '../components/LockScreen';
import { ThemeProvider } from '../components/ThemeProvider';
import { createDb, DbProvider, useDb } from '../lib/db';

// Single DB instance for the lifetime of the app process
const dbAdapter = createDb({
  url: (Constants.expoConfig?.extra?.tursoUrl as string) ?? '',
  authToken: (Constants.expoConfig?.extra?.tursoAuthToken as string) ?? '',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function RecurringGenerator() {
  const db = useDb();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const recurringRepo = new SqliteRecurringRepository(db);
    const transactionRepo = new SqliteTransactionRepository(db);
    const service = new RecurringService(recurringRepo, transactionRepo);

    service.generateDueTransactions().then((generated) => {
      if (generated.length > 0) queryClient.invalidateQueries();
    });
  }, [db]);

  return null;
}

function AppLockGuard({ children }: { children: React.ReactNode }) {
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const [locked, setLocked] = useState(true);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEnabled = settings?.appLockEnabled ?? false;
  const method = settings?.appLockMethod ?? 'biometric';

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        lockTimer.current = setTimeout(() => {
          if (isEnabled) setLocked(true);
        }, 5000);
      } else if (state === 'active') {
        if (lockTimer.current) {
          clearTimeout(lockTimer.current);
          lockTimer.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [isEnabled]);

  if (!isEnabled || !locked) return <>{children}</>;
  return <LockScreen method={method} onUnlock={() => setLocked(false)} />;
}

function ThemeManager({ children }: { children: React.ReactNode }) {
  const db = useDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  const { data: settings } = useSettings(settingsRepo);
  const updateSettings = useUpdateSettings(settingsRepo);
  const { setColorScheme } = useNativeWindColorScheme();

  const themeSetting = settings?.theme ?? 'system';
  const systemScheme = useColorScheme();

  useEffect(() => {
    if (themeSetting === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(themeSetting);
    }
  }, [themeSetting, systemScheme, setColorScheme]);

  return (
    <ThemeProvider
      setting={themeSetting}
      onSettingChange={(t) => updateSettings.mutate({ theme: t })}
    >
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Run migrations then do an initial sync before showing the UI
  useEffect(() => {
    (async () => {
      await runMigrations(dbAdapter);
      await dbAdapter.sync().catch(() => {}); // safe when offline
      setReady(true);
    })();
  }, []);

  // Re-sync every time the app comes to the foreground and refresh queries
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        dbAdapter.sync().catch(() => {});
        queryClient.invalidateQueries();
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#b5693a" />
      </View>
    );
  }

  return (
    <DbProvider db={dbAdapter}>
      <QueryClientProvider client={queryClient}>
        <RecurringGenerator />
        <ThemeManager>
          <AppLockGuard>
            <Stack screenOptions={{ headerShown: false }} />
          </AppLockGuard>
        </ThemeManager>
      </QueryClientProvider>
    </DbProvider>
  );
}
