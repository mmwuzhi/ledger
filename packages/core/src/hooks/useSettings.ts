import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ISettingsRepository } from '../repositories/ISettingsRepository';
import { Settings } from '../models/settings';

export const SETTINGS_KEYS = {
  all: ['settings'] as const,
};

export function useSettings(repo: ISettingsRepository) {
  return useQuery({
    queryKey: SETTINGS_KEYS.all,
    queryFn: () => repo.get(),
  });
}

export function useUpdateSettings(repo: ISettingsRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<Settings>) => repo.update(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all }),
  });
}
