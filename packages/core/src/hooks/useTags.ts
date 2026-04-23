import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ITagRepository } from '../repositories/ITagRepository';
import { CreateTagInput, UpdateTagInput } from '../models/tag';
import { TRANSACTION_KEYS } from './useTransactions';

export const TAG_KEYS = {
  all: ['tags'] as const,
  forTransaction: (transactionId: string) => ['tags', 'transaction', transactionId] as const,
};

export function useTags(repo: ITagRepository) {
  return useQuery({
    queryKey: TAG_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useTransactionTags(repo: ITagRepository, transactionId: string) {
  return useQuery({
    queryKey: TAG_KEYS.forTransaction(transactionId),
    queryFn: () => repo.findByTransactionId(transactionId),
    enabled: !!transactionId,
  });
}

export function useCreateTag(repo: ITagRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAG_KEYS.all }),
  });
}

export function useUpdateTag(repo: ITagRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) => repo.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAG_KEYS.all }),
  });
}

export function useDeleteTag(repo: ITagRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAG_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
    },
  });
}

export function useSetTransactionTags(repo: ITagRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, tagIds }: { transactionId: string; tagIds: string[] }) =>
      repo.setTransactionTags(transactionId, tagIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TAG_KEYS.forTransaction(variables.transactionId) });
    },
  });
}
