import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IRecurringRepository } from '../repositories/IRecurringRepository';
import { CreateRecurringInput, UpdateRecurringInput } from '../models/recurring';
import { TRANSACTION_KEYS } from './useTransactions';

export const RECURRING_KEYS = {
  all: ['recurring'] as const,
};

export function useRecurringTransactions(repo: IRecurringRepository) {
  return useQuery({
    queryKey: RECURRING_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useCreateRecurring(repo: IRecurringRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.all }),
  });
}

export function useUpdateRecurring(repo: IRecurringRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringInput }) =>
      repo.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.all }),
  });
}

export function useDeleteRecurring(repo: IRecurringRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.all }),
  });
}
