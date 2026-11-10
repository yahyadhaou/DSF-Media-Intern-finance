import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInvoiceActions } from '../../data/hooks';
import { computeTotals } from '../../domain/calc';
import { formatEuro } from '../../domain/money';
import type { CatalogItem, CompanySettings, Invoice } from '../../domain/types';
import { validateForIssue } from '../../domain/validation';
import { Button, IconButton } from '../../ui/Button';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { Icon } from '../../ui/Icon';
import { goBack, Header, Screen } from '../../ui/Layout';
import { colors, radius, space } from '../../ui/theme';
import { useAutosave, type SaveState } from '../useAutosave';
import { FinishStep, MaterialStep, ObjectStep, OrderStep, ServicesStep } from './steps';

const STEPS = ['Auftrag', 'Objekt', 'Leistungen', 'Material', 'Abschluss'] as const;

const SAVE_TEXT: Record<SaveState, string> = {
  idle: 'Speichert automatisch',
  saving: 'Speichert …',
  saved: 'Gespeichert ✓',
  error: 'Speichern fehlgeschlagen',
};

function StepBar({ step, onSelect }: { step: number; onSelect: (index: number) => void }) {
  return (
    <View style={styles.stepBar} accessibilityRole="tablist">
      {STEPS.map((label, index) => {
        const active = index === step;
        const done = index < step;
        return (
          <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onSelect(index)} style={styles.stepItem}>
            <View style={[styles.dot, active && styles.dotActive, done && styles.dotDone]}>
              {done ? <Icon name="checkmark" size={16} color="#fff" /> : <Text style={[styles.dotText, active && { color: '#fff' }]}>{index + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, active && { color: colors.navy, fontWeight: '800' }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Invoice wizard: five short steps, one topic each, with a live total in the header.
 * Every change is saved automatically as a draft.
 */
export function InvoiceEditor({ initial, company, catalog }: { initial: Invoice; company: CompanySettings; catalog: CatalogItem[] }) {
  const actions = useInvoiceActions();
  const [invoice, setInvoice] = useState(initial);
  const [step, setStep] = useState(0);
  const [issuing, setIssuing] = useState(false);
  // An unsaved new draft has identical created/updated stamps; saving always moves `updatedAt`.
  const [startedNew] = useState(() => initial.createdAt === initial.updatedAt);
  const persisted = useRef(!startedNew);

  const save = useCallback(
    async (value: Invoice) => {
      const saved = await actions.save(value);
      persisted.current = true;
      return saved;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const { state, flush } = useAutosave(invoice, save, { enabled: true });

  const totals = useMemo(() => computeTotals(invoice), [invoice]);
  const problems = useMemo(() => validateForIssue(invoice), [invoice]);
  const hasBankDetails = [company.iban, company.bic, company.bankCode, company.accountNumber].some((value) => value.trim());
  const update = useCallback((change: (value: Invoice) => Invoice) => setInvoice(change), []);

  /** Makes sure the draft exists in storage (also when nothing was typed yet) before the PDF screen reads it. */
  const persist = async () => {
    await flush();
    if (!persisted.current) await save(invoice);
  };

  const openPreview = async () => {
    try {
      await persist();
      router.push({ pathname: '/invoice/[id]/preview', params: { id: invoice.id } });
    } catch (error) {
      notify('Vorschau nicht möglich', errorMessage(error));
    }
  };

  const issue = async () => {
    const ok = await confirm({
      title: 'Rechnung ausstellen?',
      message: 'Die Rechnung bekommt jetzt ihre Nummer und kann danach nicht mehr geändert werden.',
      confirmLabel: 'Ausstellen',
    });
    if (!ok) return;
    setIssuing(true);
    try {
      await persist();
      await actions.issue(invoice.id);
    } catch (error) {
      notify('Ausstellen nicht möglich', errorMessage(error));
    } finally {
      setIssuing(false);
    }
  };

  const last = step === STEPS.length - 1;
  const stepProps = { invoice, update, catalog };

  return (
    <View style={styles.fill}>
      <Header
        title={startedNew ? 'Neue Rechnung' : 'Entwurf'}
        subtitle={SAVE_TEXT[state]}
        onBack={() => goBack('/')}
        right={
          <View style={styles.headerRight}>
            <View style={styles.totalChip}>
              <Text style={styles.totalText}>{formatEuro(totals.gross)}</Text>
            </View>
            <IconButton icon="eye-outline" label="PDF-Vorschau" color={colors.navy} onPress={() => void openPreview()} />
          </View>
        }
      />
      <StepBar step={step} onSelect={setStep} />
      <Screen
        key={step}
        footer={
          <View style={styles.footerRow}>
            {step > 0 ? <Button label="Zurück" variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
            {last ? (
              <Button label="Ausstellen" icon="checkmark-circle" loading={issuing} disabled={problems.length > 0} onPress={() => void issue()} style={{ flex: 2 }} />
            ) : (
              <Button label="Weiter" icon="arrow-forward" onPress={() => setStep(step + 1)} style={{ flex: 2 }} />
            )}
          </View>
        }
      >
        {step === 0 && <OrderStep {...stepProps} />}
        {step === 1 && <ObjectStep {...stepProps} />}
        {step === 2 && <ServicesStep {...stepProps} />}
        {step === 3 && <MaterialStep {...stepProps} />}
        {step === 4 && <FinishStep invoice={invoice} update={update} totals={totals} problems={problems} hasBankDetails={hasBankDetails} />}
        {last ? <Button label="PDF-Vorschau ansehen" icon="eye-outline" variant="secondary" onPress={() => void openPreview()} block /> : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalChip: { backgroundColor: colors.tealTint, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  totalText: { color: colors.tealDark, fontWeight: '800', fontSize: 14, fontVariant: ['tabular-nums'] },
  stepBar: { flexDirection: 'row', paddingHorizontal: space.sm, paddingBottom: space.sm, backgroundColor: colors.bg },
  stepItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 56, paddingTop: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: colors.navy },
  dotDone: { backgroundColor: colors.tealDark },
  dotText: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  stepLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  footerRow: { flexDirection: 'row', gap: space.sm },
});
