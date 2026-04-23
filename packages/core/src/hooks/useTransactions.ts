import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionSearchFilters,
} from '../models';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  detail: (id: string) => ['transactions', id] as const,
  search: (filters: TransactionSearchFilters) => ['transactions', 'search', filters] as const,
};

export function useTransactions(repo: ITransactionRepository) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useTransaction(id: string, repo: ITransactionRepository) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id),
    queryFn: () => repo.findById(id),
  });
}

export function useSearchTransactions(
  filters: TransactionSearchFilters,
  repo: ITransactionRepository
) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');
  return useQuery({
    queryKey: TRANSACTION_KEYS.search(filters),
    queryFn: () => repo.search(filters),
    enabled: hasFilters,
  });
}

export function useCreateTransaction(repo: ITransactionRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all }),
  });
}

export function useUpdateTransaction(repo: ITransactionRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      repo.update(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(id) });
    },
  });
}

export function useDeleteTransaction(repo: ITransactionRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all }),
  });
}
