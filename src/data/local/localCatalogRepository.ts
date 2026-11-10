import type { CatalogRepository } from '../ports';
import { exclusive, readCatalog, writeCatalog } from './storage';

export const localCatalogRepository: CatalogRepository = {
  list: readCatalog,

  save(item) {
    return exclusive(async () => {
      const all = await readCatalog();
      const exists = all.some((entry) => entry.id === item.id);
      await writeCatalog(exists ? all.map((entry) => (entry.id === item.id ? item : entry)) : [...all, item]);
      return item;
    });
  },

  remove(id) {
    return exclusive(async () => {
      await writeCatalog((await readCatalog()).filter((entry) => entry.id !== id));
    });
  },
};
