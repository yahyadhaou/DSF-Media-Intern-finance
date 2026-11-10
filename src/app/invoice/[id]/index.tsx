import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCatalog, useCompany, useInvoice } from '../../../data/hooks';
import { createInvoiceFromDefaults } from '../../../domain/factory';
import type { CatalogItem, CompanySettings, Invoice } from '../../../domain/types';
import { InvoiceDetail } from '../../../features/invoice/InvoiceDetail';
import { InvoiceEditor } from '../../../features/invoice/InvoiceEditor';
import { Button } from '../../../ui/Button';
import { EmptyState } from '../../../ui/Layout';
import { colors } from '../../../ui/theme';

interface HostProps {
  initial: Invoice;
  company: CompanySettings;
  catalog: CatalogItem[];
}

/** Shows the editor while the invoice is a draft and switches to the read-only view the moment it is issued. */
function InvoiceHost({ initial, company, catalog }: HostProps) {
  const live = useInvoice(initial.id).data;
  if (live?.status === 'issued') return <InvoiceDetail invoice={live} />;
  return <InvoiceEditor initial={initial} company={company} catalog={catalog} />;
}

/** The draft is created once, when the screen opens; it is only stored after the first change. */
function NewInvoice({ company, catalog }: Omit<HostProps, 'initial'>) {
  const [draft] = useState(() => createInvoiceFromDefaults(company));
  return <InvoiceHost initial={draft} company={company} catalog={catalog} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

/** `/invoice/new` starts a fresh draft; `/invoice/<id>` opens an existing one (editor for drafts, read-only once issued). */
export default function InvoiceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const company = useCompany();
  const catalog = useCatalog();
  const stored = useInvoice(id);

  if (!company.data || !catalog.data || (id !== 'new' && stored.isLoading)) {
    return (
      <Centered>
        <ActivityIndicator color={colors.tealDark} size="large" />
      </Centered>
    );
  }
  if (id === 'new') return <NewInvoice company={company.data} catalog={catalog.data} />;
  if (!stored.data) {
    return (
      <Centered>
        <EmptyState
          icon="alert-circle-outline"
          title="Rechnung nicht gefunden"
          text="Sie wurde vielleicht gelöscht."
          action={<Button label="Zur Übersicht" onPress={() => router.replace('/')} />}
        />
      </Centered>
    );
  }
  return <InvoiceHost initial={stored.data} company={company.data} catalog={catalog.data} />;
}
