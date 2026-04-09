import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ICategoryRepository } from '../repositories/ICategoryRepository';
import { CreateCategoryInput, UpdateCategoryInput } from '../models';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
};

export function useCategories(repo: ICategoryRepository) {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useCreateCategory(repo: ICategoryRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
  });
}

export function useUpdateCategory(repo: ICategoryRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      repo.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
  });
}
