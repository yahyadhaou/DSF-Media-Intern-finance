import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { CatalogItem, CompanySettings, Invoice } from '../domain/types';
import type { TravelStatement } from '../domain/travel';
import { repositories } from './index';
import type { BackupFile, Repositories } from './ports';

/** Components never import the storage code: they ask for the repositories through this context. */
const RepositoryContext = createContext<Repositories>(repositories);

export function RepositoryProvider({ value = repositories, children }: { value?: Repositories; children: ReactNode }) {
  return createElement(RepositoryContext.Provider, { value }, children);
}

export const useRepositories = () => useContext(RepositoryContext);

export const keys = {
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  travel: ['travel'] as const,
  travelOne: (id: string) => ['travel', id] as const,
  catalog: ['catalog'] as const,
  company: ['company'] as const,
};

// --- Invoices -------------------------------------------------------------------------------

export function useInvoices() {
  const repo = useRepositories();
  return useQuery({ queryKey: keys.invoices, queryFn: () => repo.invoices.list() });
}

export function useInvoice(id: string | undefined) {
  const repo = useRepositories();
  return useQuery({
    queryKey: keys.invoice(id ?? 'none'),
    queryFn: async () => (await repo.invoices.get(id!)) ?? null,
    enabled: !!id && id !== 'new',
  });
}

export function useInvoiceActions() {
  const repo = useRepositories();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: keys.invoices });
  return {
    save: (invoice: Invoice) => repo.invoices.save(invoice).then((saved) => (client.setQueryData(keys.invoice(saved.id), saved), saved)),
    remove: useMutation({ mutationFn: (id: string) => repo.invoices.delete(id), onSuccess: refresh }).mutateAsync,
    issue: useMutation({ mutationFn: (id: string) => repo.invoices.issue(id), onSuccess: refresh }).mutateAsync,
    reopen: useMutation({ mutationFn: (id: string) => repo.invoices.reopen(id), onSuccess: refresh }).mutateAsync,
    refresh,
  };
}

// --- Travel statements ----------------------------------------------------------------------

export function useTravelList() {
  const repo = useRepositories();
  return useQuery({ queryKey: keys.travel, queryFn: () => repo.travel.list() });
}

export function useTravelStatement(id: string | undefined) {
  const repo = useRepositories();
  return useQuery({
    queryKey: keys.travelOne(id ?? 'none'),
    queryFn: async () => (await repo.travel.get(id!)) ?? null,
    enabled: !!id && id !== 'new',
  });
}

export function useTravelActions() {
  const repo = useRepositories();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: keys.travel });
  return {
    save: (statement: TravelStatement) =>
      repo.travel.save(statement).then((saved) => (client.setQueryData(keys.travelOne(saved.id), saved), saved)),
    remove: useMutation({ mutationFn: (id: string) => repo.travel.delete(id), onSuccess: refresh }).mutateAsync,
    finalize: useMutation({ mutationFn: (id: string) => repo.travel.finalize(id), onSuccess: refresh }).mutateAsync,
    reopen: useMutation({ mutationFn: (id: string) => repo.travel.reopen(id), onSuccess: refresh }).mutateAsync,
    refresh,
  };
}

// --- Price list and settings ----------------------------------------------------------------

export function useCatalog() {
  const repo = useRepositories();
  return useQuery({ queryKey: keys.catalog, queryFn: () => repo.catalog.list() });
}

export function useCatalogActions() {
  const repo = useRepositories();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: keys.catalog });
  return {
    save: useMutation({ mutationFn: (item: CatalogItem) => repo.catalog.save(item), onSuccess: refresh }).mutateAsync,
    remove: useMutation({ mutationFn: (id: string) => repo.catalog.remove(id), onSuccess: refresh }).mutateAsync,
  };
}

export function useCompany() {
  const repo = useRepositories();
  return useQuery({ queryKey: keys.company, queryFn: () => repo.settings.get() });
}

export function useSaveCompany() {
  const repo = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: CompanySettings) => repo.settings.save(settings),
    onSuccess: (saved) => client.setQueryData(keys.company, saved),
  }).mutateAsync;
}

// --- Backup ---------------------------------------------------------------------------------

export function useBackup() {
  const repo = useRepositories();
  const client = useQueryClient();
  const backup = repo.backup;
  return backup
    ? {
        exportAll: (): Promise<BackupFile> => backup.exportAll(),
        importAll: async (file: BackupFile) => {
          await backup.importAll(file);
          await client.invalidateQueries();
        },
      }
    : null;
}
