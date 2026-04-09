import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookRepository } from '../repositories/IBookRepository';
import { CreateBookInput, UpdateBookInput } from '../models/book';

export const BOOK_KEYS = {
  all: ['books'] as const,
};

export function useBooks(repo: IBookRepository) {
  return useQuery({
    queryKey: BOOK_KEYS.all,
    queryFn: () => repo.findAll(),
  });
}

export function useCreateBook(repo: IBookRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookInput) => repo.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOK_KEYS.all }),
  });
}

export function useUpdateBook(repo: IBookRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookInput }) => repo.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOK_KEYS.all }),
  });
}

export function useDeleteBook(repo: IBookRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOK_KEYS.all }),
  });
}
