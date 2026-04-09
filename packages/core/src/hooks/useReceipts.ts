import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IReceiptRepository } from '../repositories/IReceiptRepository';
import { OcrResult, CreateReceiptInput } from '../models';

export const RECEIPT_KEYS = {
  detail: (id: string) => ['receipts', id] as const,
};

export function useReceipt(id: string, repo: IReceiptRepository) {
  return useQuery({
    queryKey: RECEIPT_KEYS.detail(id),
    queryFn: () => repo.findById(id),
    enabled: !!id,
  });
}

export function useCreateReceipt(repo: IReceiptRepository) {
  return useMutation({
    mutationFn: (input: CreateReceiptInput) => repo.create(input),
  });
}

export function useUpdateReceiptOcr(repo: IReceiptRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ocrResult }: { id: string; ocrResult: OcrResult }) =>
      repo.updateOcrResult(id, ocrResult),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(id) });
    },
  });
}
