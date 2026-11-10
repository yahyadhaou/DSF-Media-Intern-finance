import type { SettingsRepository } from '../ports';
import { readCompany, writeCompany } from './storage';

export const localSettingsRepository: SettingsRepository = {
  get: readCompany,

  async save(settings) {
    await writeCompany(settings);
    return settings;
  },
};
