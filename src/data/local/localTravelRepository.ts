import type { TravelStatement } from '../../domain/travel';
import type { TravelRepository } from '../ports';
import { exclusive, readTravel, writeTravel } from './storage';

const LOCKED_MESSAGE = 'Abgeschlossene Fahrtkostenabrechnungen können nicht geändert werden.';

export const localTravelRepository: TravelRepository = {
  async list() {
    const statements = await readTravel();
    return statements.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    return (await readTravel()).find((statement) => statement.id === id);
  },

  save(statement) {
    return exclusive(async () => {
      const all = await readTravel();
      if (all.find((entry) => entry.id === statement.id)?.status === 'final') throw new Error(LOCKED_MESSAGE);
      const saved: TravelStatement = { ...statement, status: 'draft', updatedAt: new Date().toISOString() };
      await writeTravel([...all.filter((entry) => entry.id !== statement.id), saved]);
      return saved;
    });
  },

  delete(id) {
    return exclusive(async () => {
      const all = await readTravel();
      if (all.find((entry) => entry.id === id)?.status === 'final') throw new Error(LOCKED_MESSAGE);
      await writeTravel(all.filter((entry) => entry.id !== id));
    });
  },

  finalize(id) {
    return exclusive(async () => {
      const all = await readTravel();
      const statement = all.find((entry) => entry.id === id);
      if (!statement) throw new Error('Fahrtkostenabrechnung nicht gefunden.');
      if (statement.status === 'final') throw new Error(LOCKED_MESSAGE);
      const finalized: TravelStatement = { ...statement, status: 'final', updatedAt: new Date().toISOString() };
      await writeTravel(all.map((entry) => (entry.id === id ? finalized : entry)));
      return finalized;
    });
  },

  reopen(id) {
    return exclusive(async () => {
      const all = await readTravel();
      const statement = all.find((entry) => entry.id === id);
      if (!statement) throw new Error('Fahrtkostenabrechnung nicht gefunden.');
      const reopened: TravelStatement = { ...statement, status: 'draft', updatedAt: new Date().toISOString() };
      await writeTravel(all.map((entry) => (entry.id === id ? reopened : entry)));
      return reopened;
    });
  },
};
