import { Settings } from '../models/settings';

export interface ISettingsRepository {
  get(): Promise<Settings>;
  update(settings: Partial<Settings>): Promise<Settings>;
}
