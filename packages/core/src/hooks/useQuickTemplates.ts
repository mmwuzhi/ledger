import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IQuickTemplateRepository } from '../repositories/IQuickTemplateRepository';
import { CreateQuickTemplateInput, UpdateQuickTemplateInput } from '../models/quick-template';

export const QUICK_TEMPLATE_KEYS = {
  all: ['quickTemplates'] as const,
};

export function useQuickTemplates(repo: IQuickTemplateRepository) {
  return useQuery({
    queryKey: QUICK_TEMPLATE_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useCreateQuickTemplate(repo: IQuickTemplateRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuickTemplateInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_TEMPLATE_KEYS.all }),
  });
}

export function useUpdateQuickTemplate(repo: IQuickTemplateRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuickTemplateInput }) =>
      repo.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_TEMPLATE_KEYS.all }),
  });
}

export function useDeleteQuickTemplate(repo: IQuickTemplateRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_TEMPLATE_KEYS.all }),
  });
}
