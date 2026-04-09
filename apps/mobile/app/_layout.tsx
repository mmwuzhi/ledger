import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import {
  runMigrations,
  RecurringService,
  SqliteRecurringRepository,
  SqliteTransactionRepository,
} from '@moneybook/core';
import { Suspense, useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function RecurringGenerator() {
  const db = useSQLiteContext();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const recurringRepo = new SqliteRecurringRepository(db);
    const transactionRepo = new SqliteTransactionRepository(db);
    const service = new RecurringService(recurringRepo, transactionRepo);

    service.generateDueTransactions().then(generated => {
      if (generated.length > 0) {
        queryClient.invalidateQueries();
      }
    });
  }, [db]);

  return null;
}

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="moneybook.db"
      onInit={runMigrations}
      useSuspense
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator /></View>}>
          <RecurringGenerator />
          <Stack screenOptions={{ headerShown: false }} />
        </Suspense>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
